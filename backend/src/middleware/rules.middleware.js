import { body, param } from "express-validator";

// ── Auth ───────────────────────────────────────────────────────────────────────

export const loginRules = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Must be a valid email"),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

export const registerRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Must be a valid email"),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

// ── Workflows ──────────────────────────────────────────────────────────────────

export const createWorkflowRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Workflow name is required")
    .isLength({ max: 100 }).withMessage("Name must be under 100 characters"),
  body("description")
    .optional()
    .isLength({ max: 500 }).withMessage("Description must be under 500 characters"),
  body("status")
    .optional()
    .isIn(["draft", "active", "on_hold", "completed"])
    .withMessage("Invalid status value"),
];

export const updateWorkflowRules = [
  param("id").isInt({ min: 1 }).withMessage("Invalid workflow ID"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage("Name must be 1–100 characters"),
  body("status")
    .optional()
    .isIn(["draft", "active", "on_hold", "completed"])
    .withMessage("Invalid status value"),
];

// ── Tasks ──────────────────────────────────────────────────────────────────────

export const createTaskRules = [
  body("title")
    .trim()
    .notEmpty().withMessage("Task title is required")
    .isLength({ max: 200 }).withMessage("Title must be under 200 characters"),
  body("workflow_id")
    .notEmpty().withMessage("Workflow ID is required")
    .isInt({ min: 1 }).withMessage("Invalid workflow ID"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"]).withMessage("Priority must be low, medium, or high"),
  body("assigned_to")
    .optional({ nullable: true, checkFalsy: true })
    .custom((val) => {
      if (val === null || val === "" || val === undefined) return true;
      if (!isNaN(parseInt(val))) return true;
      throw new Error("Invalid assignee ID");
    }),
  body("due_date")
    .optional()
    .isISO8601().withMessage("Due date must be a valid date (YYYY-MM-DD)"),
];

export const updateTaskRules = [
  param("id").isInt({ min: 1 }).withMessage("Invalid task ID"),
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage("Title must be 1–200 characters"),
  body("status")
    .optional()
    // matches DB ENUM('todo','in_progress','review','done')
    .isIn(["todo", "in_progress", "review", "done"])
    .withMessage("Invalid status value"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"]).withMessage("Priority must be low, medium, or high"),
  body("assigned_to")
    .optional({ nullable: true, checkFalsy: true })
    .custom((val) => {
      if (val === null || val === "" || val === undefined) return true;
      if (!isNaN(parseInt(val))) return true;
      throw new Error("Invalid assignee ID");
    }),
  body("phase")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 100 }).withMessage("Phase must be under 100 characters"),
  body("due_date")
    .optional({ nullable: true, checkFalsy: true })
    .custom((val) => {
      if (!val) return true;
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return true;
      throw new Error("Due date must be YYYY-MM-DD");
    }),
];

// Note: updateTaskRules extended with phase/due_date via task.routes.js direct handling