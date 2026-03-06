import express from "express";
import { db } from "../config/db.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get dashboard statistics
router.get("/stats", authenticate, async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;

    // Get workflow counts by status
    const [workflowStats] = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM workflows
      WHERE company_id = ?
      GROUP BY status
    `, [companyId]);

    // Get task counts by status
    const [taskStats] = await db.query(`
      SELECT 
        t.status,
        COUNT(*) as count
      FROM tasks t
      JOIN workflows w ON t.workflow_id = w.id
      WHERE w.company_id = ?
      GROUP BY t.status
    `, [companyId]);

    // Get recent activity (tasks updated recently)
    const [recentActivity] = await db.query(`
      SELECT 
        t.id,
        t.title,
        t.status,
        t.updated_at,
        w.name AS workflow_name,
        u.name AS updated_by_name
      FROM tasks t
      JOIN workflows w ON t.workflow_id = w.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE w.company_id = ?
      ORDER BY t.updated_at DESC
      LIMIT 10
    `, [companyId]);

    // Calculate totals
    const totalWorkflows = workflowStats.reduce((sum, w) => sum + w.count, 0);
    const activeWorkflows = workflowStats.find(w => w.status === 'active')?.count || 0;
    const completedWorkflows = workflowStats.find(w => w.status === 'completed')?.count || 0;

    const totalTasks = taskStats.reduce((sum, t) => sum + t.count, 0);
    const doneTasks = taskStats.find(t => t.status === 'done')?.count || 0;
    const inProgressTasks = taskStats.find(t => t.status === 'in_progress')?.count || 0;
    const reviewTasks = taskStats.find(t => t.status === 'review')?.count || 0;
    const todoTasks = taskStats.find(t => t.status === 'todo')?.count || 0;
    const delayedTasks = taskStats.filter(t => ['todo', 'in_progress'].includes(t.status)).length;

    // Calculate completion time (average)
    const [avgCompletion] = await db.query(`
      SELECT 
        AVG(TIMESTAMPDIFF(MINUTE, t.created_at, t.updated_at)) as avg_minutes
      FROM tasks t
      JOIN workflows w ON t.workflow_id = w.id
      WHERE w.company_id = ? AND t.status = 'done'
    `, [companyId]);

    const avgCompletionMinutes = avgCompletion[0]?.avg_minutes || 0;
    const avgHours = Math.floor(avgCompletionMinutes / 60);
    const avgMins = Math.round(avgCompletionMinutes % 60);

    // Get team members and their task counts
    const [teamStats] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        COUNT(t.id) as task_count,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_count
      FROM users u
      LEFT JOIN tasks t ON t.assigned_to = u.id
      WHERE u.company_id = ?
      GROUP BY u.id
      ORDER BY task_count DESC
    `, [companyId]);

    // Get workflow efficiency (tasks completed / tasks total)
    const efficiency = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    res.json({
      stats: {
        activeWorkflows,
        completedWorkflows,
        totalWorkflows,
        avgCompletionTime: avgHours > 0 ? `${avgHours}h ${avgMins}m` : `${avgMins}m`,
        delayedTasks,
        teamEfficiency: efficiency,
        totalTasks,
        doneTasks,
        inProgressTasks,
        reviewTasks,
        todoTasks
      },
      recentActivity: recentActivity.map(a => ({
        id: a.id,
        title: a.title,
        status: a.status,
        workflow_name: a.workflow_name,
        updated_by: a.updated_by_name,
        updated_at: a.updated_at
      })),
      teamMembers: teamStats.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        tasks: m.task_count || 0,
        completed: m.completed_count || 0
      }))
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get activity feed
router.get("/activity", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { limit = 20 } = req.query;

    const [activities] = await db.query(`
      SELECT 
        l.id,
        l.task_id,
        t.title AS task_title,
        w.name AS workflow_name,
        l.old_status,
        l.new_status,
        l.changed_at,
        u.name AS changed_by_name
      FROM task_status_logs l
      JOIN tasks t ON l.task_id = t.id
      JOIN workflows w ON t.workflow_id = w.id
      JOIN users u ON l.changed_by = u.id
      WHERE w.company_id = ?
      ORDER BY l.changed_at DESC
      LIMIT ?
    `, [companyId, parseInt(limit)]);

    res.json(activities.map(a => ({
      id: a.id,
      task_id: a.task_id,
      task_title: a.task_title,
      workflow_name: a.workflow_name,
      old_status: a.old_status,
      new_status: a.new_status,
      changed_by: a.changed_by_name,
      changed_at: a.changed_at
    })));
  } catch (error) {
    console.error("Get activity error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get team members
router.get("/team", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;

    const [members] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        COUNT(t.id) as task_count,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as active_tasks
      FROM users u
      LEFT JOIN tasks t ON t.assigned_to = u.id
      WHERE u.company_id = ?
      GROUP BY u.id
      ORDER BY u.role, u.name
    `, [companyId]);

    res.json(members.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      joined_at: m.created_at,
      tasks: {
        total: m.task_count || 0,
        completed: m.completed_tasks || 0,
        active: m.active_tasks || 0
      }
    })));
  } catch (error) {
    console.error("Get team error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
