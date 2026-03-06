import express from "express";
import { db } from "../config/db.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get all tasks for the user's company (optionally filtered by workflow)
router.get("/", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { workflow_id, status, priority, assigned_to, search } = req.query;

    let query = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.workflow_id,
        t.assigned_to,
        t.created_at,
        t.updated_at,
        w.name AS workflow_name,
        u.name AS assignee_name,
        u.email AS assignee_email
      FROM tasks t
      JOIN workflows w ON t.workflow_id = w.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE w.company_id = ?
    `;

    const params = [companyId];

    if (workflow_id) {
      query += ' AND t.workflow_id = ?';
      params.push(workflow_id);
    }

    if (status && status !== 'all') {
      query += ' AND t.status = ?';
      params.push(status);
    }

    if (priority && priority !== 'all') {
      query += ' AND t.priority = ?';
      params.push(priority);
    }

    if (assigned_to && assigned_to !== 'all') {
      query += ' AND t.assigned_to = ?';
      params.push(assigned_to);
    }

    if (search) {
      query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY 
      CASE t.status 
        WHEN 'todo' THEN 1 
        WHEN 'in_progress' THEN 2 
        WHEN 'review' THEN 3 
        WHEN 'done' THEN 4 
      END,
      FIELD(t.priority, 'high', 'medium', 'low'),
      t.updated_at DESC`;

    const [tasks] = await db.query(query, params);

    res.json(tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      workflow_id: t.workflow_id,
      workflow_name: t.workflow_name,
      assigned_to: t.assigned_to,
      assignee: t.assignee_name ? {
        id: t.assigned_to,
        name: t.assignee_name,
        email: t.assignee_email
      } : null,
      created_at: t.created_at,
      updated_at: t.updated_at,
      comments: t.comment_count || 0
    })));
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single task by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const [tasks] = await db.query(`
      SELECT 
        t.*,
        w.name AS workflow_name,
        w.company_id,
        u.name AS assignee_name,
        u.email AS assignee_email
      FROM tasks t
      JOIN workflows w ON t.workflow_id = w.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ? AND w.company_id = ?
    `, [id, companyId]);

    if (tasks.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = tasks[0];

    // Get status change history
    const [logs] = await db.query(`
      SELECT 
        l.*,
        u.name AS changer_name
      FROM task_status_logs l
      JOIN users u ON l.changed_by = u.id
      WHERE l.task_id = ?
      ORDER BY l.changed_at DESC
    `, [id]);

    // Get reviews if any
    const [reviews] = await db.query(`
      SELECT 
        r.*,
        u.name AS reviewer_name
      FROM task_reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.task_id = ?
      ORDER BY r.reviewed_at DESC
    `, [id]);

    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      workflow_id: task.workflow_id,
      workflow_name: task.workflow_name,
      assigned_to: task.assigned_to,
      assignee: task.assignee_name ? {
        id: task.assigned_to,
        name: task.assignee_name,
        email: task.assignee_email
      } : null,
      created_at: task.created_at,
      updated_at: task.updated_at,
      status_logs: logs.map(l => ({
        id: l.id,
        old_status: l.old_status,
        new_status: l.new_status,
        changed_by: l.changed_by,
        changer_name: l.changer_name,
        changed_at: l.changed_at
      })),
      reviews: reviews.map(r => ({
        id: r.id,
        review_status: r.review_status,
        comments: r.comments,
        reviewer: { id: r.reviewer_id, name: r.reviewer_name },
        reviewed_at: r.reviewed_at
      }))
    });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create new task
router.post("/", authenticate, async (req, res) => {
  try {
    const { workflow_id, title, description, priority = 'medium', assigned_to } = req.body;
    const { companyId } = req.user;

    if (!workflow_id || !title) {
      return res.status(400).json({ message: "Workflow ID and title are required" });
    }

    // Verify workflow belongs to user's company
    const [workflows] = await db.query(
      'SELECT id FROM workflows WHERE id = ? AND company_id = ?',
      [workflow_id, companyId]
    );

    if (workflows.length === 0) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    const [result] = await db.query(
      `INSERT INTO tasks (workflow_id, assigned_to, title, description, priority, status) 
       VALUES (?, ?, ?, ?, ?, 'todo')`,
      [workflow_id, assigned_to || null, title, description, priority]
    );

    // Log the creation
    await db.query(
      `INSERT INTO task_status_logs (task_id, old_status, new_status, changed_by)
       VALUES (?, NULL, 'todo', ?)`,
      [result.insertId, req.user.userId]
    );

    const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);

    res.status(201).json({
      id: tasks[0].id,
      title: tasks[0].title,
      description: tasks[0].description,
      priority: tasks[0].priority,
      status: tasks[0].status,
      workflow_id: tasks[0].workflow_id,
      assigned_to: tasks[0].assigned_to,
      created_at: tasks[0].created_at
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update task
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, assigned_to, workflow_id } = req.body;
    const { companyId, userId } = req.user;

    // Get current task
    const [tasks] = await db.query(`
      SELECT t.*, w.company_id 
      FROM tasks t 
      JOIN workflows w ON t.workflow_id = w.id 
      WHERE t.id = ? AND w.company_id = ?
    `, [id, companyId]);

    if (tasks.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const oldTask = tasks[0];
    const oldStatus = oldTask.status;

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (priority !== undefined) { updates.push('priority = ?'); params.push(priority); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (assigned_to !== undefined) { updates.push('assigned_to = ?'); params.push(assigned_to || null); }
    if (workflow_id !== undefined) { updates.push('workflow_id = ?'); params.push(workflow_id); }

    if (updates.length > 0) {
      params.push(id);
      await db.query(
        `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    // Log status change
    if (status && status !== oldStatus) {
      await db.query(
        `INSERT INTO task_status_logs (task_id, old_status, new_status, changed_by)
         VALUES (?, ?, ?, ?)`,
        [id, oldStatus, status, userId]
      );
    }

    const [updated] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);

    res.json({
      id: updated[0].id,
      title: updated[0].title,
      description: updated[0].description,
      priority: updated[0].priority,
      status: updated[0].status,
      workflow_id: updated[0].workflow_id,
      assigned_to: updated[0].assigned_to,
      updated_at: updated[0].updated_at
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete task
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const [result] = await db.query(`
      DELETE t FROM tasks t
      JOIN workflows w ON t.workflow_id = w.id
      WHERE t.id = ? AND w.company_id = ?
    `, [id, companyId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add comment/review to task
router.post("/:id/review", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { review_status, comments } = req.body;
    const { companyId, userId } = req.user;

    if (!review_status) {
      return res.status(400).json({ message: "Review status is required" });
    }

    // Verify task belongs to user's company
    const [tasks] = await db.query(`
      SELECT t.id FROM tasks t
      JOIN workflows w ON t.workflow_id = w.id
      WHERE t.id = ? AND w.company_id = ?
    `, [id, companyId]);

    if (tasks.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const [result] = await db.query(
      `INSERT INTO task_reviews (task_id, reviewer_id, review_status, comments)
       VALUES (?, ?, ?, ?)`,
      [id, userId, review_status, comments]
    );

    // If rejected, move task back to in_progress
    if (review_status === 'rejected') {
      await db.query(
        `INSERT INTO task_status_logs (task_id, old_status, new_status, changed_by)
         SELECT ?, status, 'in_progress', ? FROM tasks WHERE id = ?`,
        [id, userId, id]
      );
      await db.query('UPDATE tasks SET status = "in_progress" WHERE id = ?', [id]);
    }

    res.status(201).json({ message: "Review added successfully" });
  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
