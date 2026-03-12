import express from "express";
import { db } from "../config/db.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireMinRole, requireRole } from "../middleware/rbac.middleware.js";
import { createTaskRules, updateTaskRules } from "../middleware/rules.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = express.Router();

// GET all tasks — everyone
router.get("/", authenticate, async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;
    const { workflow_id, status, priority, assigned_to, search } = req.query;

    let query = `
      SELECT t.id, t.title, t.description, t.priority, t.status, t.phase,
        t.workflow_id, t.assigned_to, t.due_date, t.created_at, t.updated_at,
        w.name AS workflow_name, u.name AS assignee_name, u.email AS assignee_email,
        (SELECT l.new_status FROM task_status_logs l WHERE l.task_id = t.id ORDER BY l.changed_at DESC LIMIT 1) AS last_phase_update,
        (SELECT l.changed_at FROM task_status_logs l WHERE l.task_id = t.id ORDER BY l.changed_at DESC LIMIT 1) AS last_updated_by_user
      FROM tasks t
      JOIN workflows w ON t.workflow_id = w.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE w.company_id = ?
    `;
    const params = [companyId];

    if (role === "member") { query += ' AND t.assigned_to = ?'; params.push(userId); }
    if (workflow_id) { query += ' AND t.workflow_id = ?'; params.push(workflow_id); }
    if (status && status !== 'all') { query += ' AND t.status = ?'; params.push(status); }
    if (priority && priority !== 'all') { query += ' AND t.priority = ?'; params.push(priority); }
    if (assigned_to && assigned_to !== 'all' && role !== "member") { query += ' AND t.assigned_to = ?'; params.push(assigned_to); }
    if (search) { query += ' AND (t.title LIKE ? OR t.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    query += ` ORDER BY w.name, CASE t.status WHEN 'todo' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'review' THEN 3 WHEN 'done' THEN 4 END, t.updated_at DESC`;

    const [tasks] = await db.query(query, params);

    res.json(tasks.map(t => ({
      id: t.id, title: t.title, description: t.description, priority: t.priority,
      status: t.status, phase: t.phase || null,
      workflow_id: t.workflow_id, workflow_name: t.workflow_name,
      assigned_to: t.assigned_to,
      assignee: t.assignee_name ? { id: t.assigned_to, name: t.assignee_name, email: t.assignee_email } : null,
      due_date: t.due_date, created_at: t.created_at, updated_at: t.updated_at,
      last_updated_by_user: t.last_updated_by_user || t.updated_at,
      comments: t.comment_count || 0
    })));
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET single task — everyone
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const [tasks] = await db.query(`
      SELECT t.*, w.name AS workflow_name, w.company_id, u.name AS assignee_name, u.email AS assignee_email
      FROM tasks t JOIN workflows w ON t.workflow_id = w.id LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ? AND w.company_id = ?
    `, [id, companyId]);

    if (tasks.length === 0) return res.status(404).json({ message: "Task not found" });

    const task = tasks[0];
    const [logs] = await db.query(
      `SELECT l.*, u.name AS changer_name FROM task_status_logs l JOIN users u ON l.changed_by = u.id WHERE l.task_id = ? ORDER BY l.changed_at DESC`,
      [id]
    );
    const [reviews] = await db.query(
      `SELECT r.*, u.name AS reviewer_name FROM task_reviews r JOIN users u ON r.reviewer_id = u.id WHERE r.task_id = ? ORDER BY r.reviewed_at DESC`,
      [id]
    );

    res.json({
      id: task.id, title: task.title, description: task.description, priority: task.priority,
      status: task.status, phase: task.phase || null,
      workflow_id: task.workflow_id, workflow_name: task.workflow_name,
      assigned_to: task.assigned_to,
      assignee: task.assignee_name ? { id: task.assigned_to, name: task.assignee_name, email: task.assignee_email } : null,
      due_date: task.due_date, created_at: task.created_at, updated_at: task.updated_at,
      status_logs: logs.map(l => ({ id: l.id, old_status: l.old_status, new_status: l.new_status, changed_by: l.changed_by, changer_name: l.changer_name, changed_at: l.changed_at })),
      reviews: reviews.map(r => ({ id: r.id, review_status: r.review_status, comments: r.comments, reviewer: { id: r.reviewer_id, name: r.reviewer_name }, reviewed_at: r.reviewed_at }))
    });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST create task — admin & manager only
router.post("/", authenticate, requireMinRole("manager"), createTaskRules, validate, async (req, res) => {
  try {
    const { workflow_id, title, description, priority = 'medium', assigned_to, due_date, phase } = req.body;
    const { companyId } = req.user;

    const [workflows] = await db.query('SELECT id FROM workflows WHERE id = ? AND company_id = ?', [workflow_id, companyId]);
    if (workflows.length === 0) return res.status(404).json({ message: "Workflow not found" });

    const [result] = await db.query(
      `INSERT INTO tasks (workflow_id, assigned_to, title, description, priority, status, due_date, phase) VALUES (?, ?, ?, ?, ?, 'todo', ?, ?)`,
      [workflow_id, assigned_to ? parseInt(assigned_to) : null, title, description, priority, due_date || null, phase || null]
    );
    await db.query(
      `INSERT INTO task_status_logs (task_id, old_status, new_status, changed_by) VALUES (?, NULL, 'todo', ?)`,
      [result.insertId, req.user.userId]
    );
    const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);

    res.status(201).json({
      id: tasks[0].id, title: tasks[0].title, description: tasks[0].description,
      priority: tasks[0].priority, status: tasks[0].status, phase: tasks[0].phase,
      workflow_id: tasks[0].workflow_id, assigned_to: tasks[0].assigned_to,
      due_date: tasks[0].due_date, created_at: tasks[0].created_at
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT update task
router.put("/:id", authenticate, updateTaskRules, validate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, assigned_to, workflow_id, due_date, phase } = req.body;
    const { companyId, userId, role } = req.user;

    const parsedAssignedTo = assigned_to ? parseInt(assigned_to) : null;

    const [tasks] = await db.query(`
      SELECT t.*, w.company_id FROM tasks t JOIN workflows w ON t.workflow_id = w.id
      WHERE t.id = ? AND w.company_id = ?
    `, [id, companyId]);

    if (tasks.length === 0) return res.status(404).json({ message: "Task not found" });

    const oldTask = tasks[0];

    // Member: can only update status + phase on own task
    if (role === "member") {
      if (parseInt(oldTask.assigned_to) !== parseInt(userId)) {
        return res.status(403).json({ error: "Forbidden", message: "You can only update your own assigned tasks" });
      }
      const memberUpdates = [];
      const memberParams = [];
      if (status && status !== oldTask.status) { memberUpdates.push('status = ?'); memberParams.push(status); }
      if (phase !== undefined) { memberUpdates.push('phase = ?'); memberParams.push(phase || null); }
      if (memberUpdates.length > 0) {
        memberParams.push(id);
        await db.query(`UPDATE tasks SET ${memberUpdates.join(', ')} WHERE id = ?`, memberParams);
      }
      if (status && status !== oldTask.status) {
        await db.query(
          `INSERT INTO task_status_logs (task_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)`,
          [id, oldTask.status, status, userId]
        );
      }
      const [updated] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
      return res.json({ id: updated[0].id, status: updated[0].status, phase: updated[0].phase, updated_at: updated[0].updated_at });
    }

    if (role === "viewer") {
      return res.status(403).json({ error: "Forbidden", message: "Viewers cannot modify tasks" });
    }

    // Manager & Admin: full update
    const updates = [];
    const params = [];
    if (title !== undefined)       { updates.push('title = ?');       params.push(title); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (priority !== undefined)    { updates.push('priority = ?');    params.push(priority); }
    if (status !== undefined)      { updates.push('status = ?');      params.push(status); }
    if (assigned_to !== undefined) { updates.push('assigned_to = ?'); params.push(parsedAssignedTo); }
    if (workflow_id !== undefined) { updates.push('workflow_id = ?'); params.push(workflow_id); }
    if (due_date !== undefined)    { updates.push('due_date = ?');    params.push(due_date || null); }
    if (phase !== undefined)       { updates.push('phase = ?');       params.push(phase || null); }

    if (updates.length > 0) {
      params.push(id);
      await db.query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    if (status && status !== oldTask.status) {
      await db.query(
        `INSERT INTO task_status_logs (task_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)`,
        [id, oldTask.status, status, userId]
      );
    }

    const [updated] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json({
      id: updated[0].id, title: updated[0].title, description: updated[0].description,
      priority: updated[0].priority, status: updated[0].status, phase: updated[0].phase,
      workflow_id: updated[0].workflow_id, assigned_to: updated[0].assigned_to,
      due_date: updated[0].due_date, updated_at: updated[0].updated_at
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE task — admin only
router.delete("/:id", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const [result] = await db.query(`
      DELETE t FROM tasks t JOIN workflows w ON t.workflow_id = w.id
      WHERE t.id = ? AND w.company_id = ?
    `, [id, companyId]);

    if (result.affectedRows === 0) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST review — admin & manager only
router.post("/:id/review", authenticate, requireMinRole("manager"), async (req, res) => {
  try {
    const { id } = req.params;
    const { review_status, comments } = req.body;
    const { companyId, userId } = req.user;

    if (!review_status) return res.status(400).json({ message: "Review status is required" });

    const [tasks] = await db.query(
      `SELECT t.id FROM tasks t JOIN workflows w ON t.workflow_id = w.id WHERE t.id = ? AND w.company_id = ?`,
      [id, companyId]
    );
    if (tasks.length === 0) return res.status(404).json({ message: "Task not found" });

    await db.query(
      `INSERT INTO task_reviews (task_id, reviewer_id, review_status, comments) VALUES (?, ?, ?, ?)`,
      [id, userId, review_status, comments]
    );

    if (review_status === 'rejected') {
      await db.query(
        `INSERT INTO task_status_logs (task_id, old_status, new_status, changed_by) SELECT ?, status, 'in_progress', ? FROM tasks WHERE id = ?`,
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