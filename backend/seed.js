import bcrypt from "bcrypt";
import { db } from "./src/config/db.js";

async function seed() {
  console.log("Seeding database...");

  try {
    // Drop existing tables in correct order
    await db.query(`DROP TABLE IF EXISTS task_comments`).catch(() => {});
    await db.query(`DROP TABLE IF EXISTS task_reviews`).catch(() => {});
    await db.query(`DROP TABLE IF EXISTS task_status_logs`).catch(() => {});
    await db.query(`DROP TABLE IF EXISTS tasks`).catch(() => {});
    await db.query(`DROP TABLE IF EXISTS workflows`).catch(() => {});
    await db.query(`DROP TABLE IF EXISTS users`).catch(() => {});
    await db.query(`DROP TABLE IF EXISTS companies`).catch(() => {});

    console.log("Dropped existing tables...");

    // ── Create Tables ──────────────────────────────────────────────────────────

    await db.query(`
      CREATE TABLE companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'manager', 'member', 'viewer') DEFAULT 'member',
        company_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE workflows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('draft', 'active', 'on_hold', 'completed') DEFAULT 'draft',
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        category VARCHAR(100),
        company_id INT NOT NULL,
        created_by INT,
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await db.query(`
      CREATE TABLE tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        status ENUM('todo', 'in_progress', 'review', 'done') DEFAULT 'todo',
        workflow_id INT NOT NULL,
        assigned_to INT,
        due_date DATE,
        phase VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await db.query(`
      CREATE TABLE task_status_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        old_status VARCHAR(50),
        new_status VARCHAR(50) NOT NULL,
        changed_by INT NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE task_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        reviewer_id INT NOT NULL,
        review_status ENUM('approved', 'rejected') NOT NULL,
        comments TEXT,
        reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE task_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("Tables created successfully!");

    // ── Insert Company ─────────────────────────────────────────────────────────

    await db.query("INSERT INTO companies (name) VALUES ('Acme Corporation')");
    const companyId = 1;

    // ── Insert Users with name-based passwords ─────────────────────────────────
    // Password format: firstname + 123  (e.g. john123, sarah123)

    const users = [
      { name: "John Admin",   email: "john@acme.com",   password: "john123",   role: "admin"   },
      { name: "Sarah Chen",   email: "sarah@acme.com",  password: "sarah123",  role: "manager" },
      { name: "Mike Johnson", email: "mike@acme.com",   password: "mike123",   role: "member"  },
      { name: "Emily Davis",  email: "emily@acme.com",  password: "emily123",  role: "member"  },
      { name: "Alex Kim",     email: "alex@acme.com",   password: "alex123",   role: "viewer"  },
    ];

    const userIds = [];
    for (const user of users) {
      const hash = await bcrypt.hash(user.password, 10);
      const [result] = await db.query(
        "INSERT INTO users (name, email, password_hash, role, company_id) VALUES (?, ?, ?, ?, ?)",
        [user.name, user.email, hash, user.role, companyId]
      );
      userIds.push(result.insertId);
      console.log(`  ✅ ${user.name} (${user.role}) — password: ${user.password}`);
    }

    console.log("Users created!");

    // ── Insert Workflows ───────────────────────────────────────────────────────

    const workflows = [
      { name: "Employee Onboarding",  description: "Complete onboarding for new hires",      status: "active",    priority: "high",   category: "HR",         due_date: new Date(Date.now() + 30 * 86400000) },
      { name: "Invoice Processing",   description: "Monthly invoice approval workflow",       status: "active",    priority: "medium", category: "Finance",    due_date: new Date(Date.now() +  7 * 86400000) },
      { name: "Client Onboarding",    description: "New client setup and welcome process",    status: "completed", priority: "high",   category: "Sales",      due_date: new Date(Date.now() -  7 * 86400000) },
      { name: "Q4 Planning",          description: "Quarterly planning and goal setting",     status: "on_hold",   priority: "medium", category: "Operations", due_date: new Date(Date.now() + 14 * 86400000) },
      { name: "Product Launch",       description: "Marketing and sales enablement",          status: "active",    priority: "high",   category: "Marketing",  due_date: new Date(Date.now() + 21 * 86400000) },
    ];

    const workflowIds = [];
    for (const wf of workflows) {
      const [result] = await db.query(
        "INSERT INTO workflows (name, description, status, priority, category, company_id, created_by, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [wf.name, wf.description, wf.status, wf.priority, wf.category, companyId, userIds[0], wf.due_date]
      );
      workflowIds.push(result.insertId);
    }

    console.log("Workflows created!");

    // ── Insert Tasks ───────────────────────────────────────────────────────────

    const allTasks = [
      // Workflow 0: Employee Onboarding
      { title: "Send welcome email",      description: "Send personalized welcome email",   priority: "high",   status: "done",        wf: 0, assigned: userIds[1], phase: "Completed",       due_date: "2026-03-10" },
      { title: "Setup workstation",       description: "Prepare laptop and software",       priority: "high",   status: "done",        wf: 0, assigned: userIds[2], phase: "Completed",       due_date: "2026-03-10" },
      { title: "Create accounts",         description: "Setup email and Slack accounts",    priority: "high",   status: "in_progress", wf: 0, assigned: userIds[1], phase: "In development",  due_date: "2026-03-17" },
      { title: "Schedule orientation",    description: "Book orientation meeting",          priority: "medium", status: "done",        wf: 0, assigned: userIds[1], phase: "Completed",       due_date: "2026-03-10" },
      { title: "Assign buddy",            description: "Pair with team buddy",              priority: "medium", status: "todo",        wf: 0, assigned: userIds[0], phase: "Planning",        due_date: "2026-03-19" },
      { title: "Prepare documentation",   description: "Gather onboarding documents",      priority: "medium", status: "in_progress", wf: 0, assigned: userIds[3], phase: "In development",  due_date: "2026-03-17" },
      { title: "Schedule training",       description: "Book training sessions",            priority: "medium", status: "todo",        wf: 0, assigned: userIds[1] },
      { title: "Team introduction",       description: "Introduce to team",                priority: "low",    status: "todo",        wf: 0, assigned: userIds[1] },
      { title: "Benefits enrollment",     description: "Help with benefits",               priority: "high",   status: "todo",        wf: 0, assigned: userIds[4], phase: "Not started",     due_date: "2026-03-26"  },
      { title: "Final check",             description: "Verify all items completed",       priority: "medium", status: "todo",        wf: 0, assigned: userIds[0] },

      // Workflow 1: Invoice Processing
      { title: "Receive invoice",         description: "Receive and log invoice",          priority: "high",   status: "done",        wf: 1, assigned: userIds[2], phase: "Completed",       due_date: "2026-03-10" },
      { title: "Verify details",          description: "Verify against PO",               priority: "high",   status: "done",        wf: 1, assigned: userIds[2], phase: "Completed",       due_date: "2026-03-10" },
      { title: "Manager approval",        description: "Get approval",                    priority: "high",   status: "in_progress", wf: 1, assigned: userIds[0], phase: "Waiting for review", due_date: "2026-03-17" },
      { title: "Process payment",         description: "Process payment",                 priority: "high",   status: "todo",        wf: 1, assigned: userIds[4], phase: "Not started",     due_date: "2026-03-19" },
      { title: "File invoice",            description: "File for records",                priority: "low",    status: "todo",        wf: 1, assigned: userIds[2] },

      // Workflow 3: Q4 Planning
      { title: "Gather data",             description: "Collect Q3 data",                 priority: "medium", status: "done",        wf: 3, assigned: userIds[4], phase: "Completed",       due_date: "2026-03-10" },
      { title: "Draft goals",             description: "Draft Q4 goals",                  priority: "high",   status: "in_progress", wf: 3, assigned: userIds[4], phase: "In development",  due_date: "2026-03-19" },
      { title: "Team feedback",           description: "Collect feedback",                priority: "medium", status: "todo",        wf: 3, assigned: userIds[4], phase: "Not started",     due_date: "2026-03-26"  },
      { title: "Finalize plan",           description: "Finalize plan",                   priority: "high",   status: "todo",        wf: 3, assigned: userIds[0], phase: "Not started",     due_date: "2026-03-26"  },
    ];

    for (const task of allTasks) {
      const [result] = await db.query(
        "INSERT INTO tasks (title, description, priority, status, workflow_id, assigned_to, due_date, phase) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [task.title, task.description, task.priority, task.status, workflowIds[task.wf], task.assigned, task.due_date || null, task.phase || null]
      );
      await db.query(
        "INSERT INTO task_status_logs (task_id, old_status, new_status, changed_by) VALUES (?, NULL, ?, ?)",
        [result.insertId, task.status, userIds[0]]
      );
    }

    // Sample comment
    const [taskForComment] = await db.query("SELECT id FROM tasks WHERE title = 'Create accounts' LIMIT 1");
    if (taskForComment.length > 0) {
      await db.query(
        "INSERT INTO task_comments (task_id, user_id, comment) VALUES (?, ?, ?)",
        [taskForComment[0].id, userIds[1], "Email account has been created, waiting for IT setup"]
      );
    }

    console.log("Tasks and logs created!");
    console.log("\n✅ Database seeded successfully!");
    console.log("\n── Login Credentials ─────────────────────────────");
    console.log("  john@acme.com   / john123   (admin)");
    console.log("  sarah@acme.com  / sarah123  (manager)");
    console.log("  mike@acme.com   / mike123   (member)");
    console.log("  emily@acme.com  / emily123  (member)");
    console.log("  alex@acme.com   / alex123   (viewer)");
    console.log("──────────────────────────────────────────────────");

  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    process.exit(0);
  }
}

seed();