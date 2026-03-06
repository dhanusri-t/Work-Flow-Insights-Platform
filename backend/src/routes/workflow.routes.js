import express from "express";
import { db } from "../config/db.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get all workflows for the user's company
router.get("/", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { status, search } = req.query;

    let query = `
      SELECT 
        w.id,
        w.name,
        w.description,
        w.status,
        w.created_at,
        w.updated_at,
        u.name AS creator_name,
        (SELECT COUNT(*) FROM tasks WHERE workflow_id = w.id) AS task_count,
        (SELECT COUNT(*) FROM tasks WHERE workflow_id = w.id AND status = 'done') AS completed_task_count
      FROM workflows w
      JOIN users u ON w.created_by = u.id
      WHERE w.company_id = ?
    `;

    const params = [companyId];

    if (status && status !== 'all') {
      query += ' AND w.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (w.name LIKE ? OR w.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY w.updated_at DESC';

    const [workflows] = await db.query(query, params);

    // Get assignees for each workflow
    const workflowIds = workflows.map(w => w.id);
    let assigneeMap = {};

    if (workflowIds.length > 0) {
      const [assignees] = await db.query(`
        SELECT DISTINCT t.workflow_id, u.id, u.name
        FROM tasks t
        JOIN users u ON t.assigned_to = u.id
        WHERE t.workflow_id IN (?)
      `, [workflowIds]);

      assigneeMap = assignees.reduce((acc, a) => {
        if (!acc[a.workflow_id]) acc[a.workflow_id] = [];
        acc[a.workflow_id].push({ id: a.id, name: a.name });
        return acc;
      }, {});
    }

    const result = workflows.map(w => ({
      id: w.id,
      title: w.name,
      description: w.description,
      status: w.status,
      created_at: w.created_at,
      updated_at: w.updated_at,
      creator_name: w.creator_name,
      taskCount: {
        completed: w.completed_task_count || 0,
        total: w.task_count || 0
      },
      assignee: assigneeMap[w.id] || []
    }));

    res.json(result);
  } catch (error) {
    console.error("Get workflows error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single workflow by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const [workflows] = await db.query(`
      SELECT 
        w.*,
        u.name AS creator_name
      FROM workflows w
      JOIN users u ON w.created_by = u.id
      WHERE w.id = ? AND w.company_id = ?
    `, [id, companyId]);

    if (workflows.length === 0) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    const workflow = workflows[0];

    // Get tasks for this workflow
    const [tasks] = await db.query(`
      SELECT 
        t.*,
        u.name AS assignee_name,
        u.email AS assignee_email
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.workflow_id = ?
      ORDER BY 
        CASE t.status 
          WHEN 'todo' THEN 1 
          WHEN 'in_progress' THEN 2 
          WHEN 'review' THEN 3 
          WHEN 'done' THEN 4 
        END,
        FIELD(t.priority, 'high', 'medium', 'low')
    `, [id]);

    res.json({
      id: workflow.id,
      title: workflow.name,
      description: workflow.description,
      status: workflow.status,
      created_by: workflow.created_by,
      creator_name: workflow.creator_name,
      created_at: workflow.created_at,
      updated_at: workflow.updated_at,
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        assigned_to: t.assigned_to,
        assignee: t.assignee_name ? { 
          id: t.assigned_to, 
          name: t.assignee_name,
          email: t.assignee_email
        } : null,
        created_at: t.created_at,
        updated_at: t.updated_at
      }))
    });
  } catch (error) {
    console.error("Get workflow error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create new workflow
router.post("/", authenticate, async (req, res) => {
  try {
    const { name, description, status = 'active' } = req.body;
    const { companyId, userId } = req.user;

    if (!name) {
      return res.status(400).json({ message: "Workflow name is required" });
    }

    const [result] = await db.query(
      `INSERT INTO workflows (company_id, name, description, status, created_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [companyId, name, description, status, userId]
    );

    const [workflows] = await db.query(
      'SELECT * FROM workflows WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      id: workflows[0].id,
      title: workflows[0].name,
      description: workflows[0].description,
      status: workflows[0].status,
      created_at: workflows[0].created_at
    });
  } catch (error) {
    console.error("Create workflow error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update workflow
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    const { companyId } = req.user;

    // Check if workflow belongs to user's company
    const [workflows] = await db.query(
      'SELECT * FROM workflows WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (workflows.length === 0) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    await db.query(
      `UPDATE workflows 
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [name, description, status, id]
    );

    const [updated] = await db.query('SELECT * FROM workflows WHERE id = ?', [id]);

    res.json({
      id: updated[0].id,
      title: updated[0].name,
      description: updated[0].description,
      status: updated[0].status,
      updated_at: updated[0].updated_at
    });
  } catch (error) {
    console.error("Update workflow error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete workflow
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const [result] = await db.query(
      'DELETE FROM workflows WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    res.json({ message: "Workflow deleted successfully" });
  } catch (error) {
    console.error("Delete workflow error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
