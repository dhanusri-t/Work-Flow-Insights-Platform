import bcrypt from "bcrypt";
import { db } from "./src/config/db.js";

async function seed() {
  console.log("Seeding database...");
  
  try {
    // Drop existing tables in correct order to handle foreign keys
    await db.query(`DROP TABLE IF EXISTS task_comments`).catch(() => {});
    await db.query(`DROP TABLE IF EXISTS task_reviews`).catch(() => {});
    await db.query(`DROP TABLE IF EXISTS task_status_logs`).catch(() => {});
    await db.query(`DROP TABLE IF EXISTS tasks`).catch(() => {});
    await db.query(`DROP TABLE IF EXISTS workflows`).catch(() => {});
    await db.query(`DROP TABLE IF EXISTS users`).catch(() => {});
    await db.query(`DROP TABLE IF EXISTS companies`).catch(() => {});
    
    console.log("Dropped existing tables...");
    
    // Create tables
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
        role ENUM('admin', 'member') DEFAULT 'member',
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
    
    // Check if data already exists
    const [existingCompanies] = await db.query("SELECT COUNT(*) as count FROM companies");
    if (existingCompanies[0].count > 0) {
      console.log("Database already seeded. Skipping...");
      process.exit(0);
    }
    
    // Insert companies
    await db.query("INSERT INTO companies (name) VALUES ('Acme Corporation')");
    const companyId = 1;
    
    // Hash password
    const passwordHash = await bcrypt.hash("password123", 10);
    
    // Insert users
    const users = [
      { name: "John Admin", email: "john@acme.com", role: "admin" },
      { name: "Sarah Chen", email: "sarah@acme.com", role: "member" },
      { name: "Mike Johnson", email: "mike@acme.com", role: "member" },
      { name: "Emily Davis", email: "emily@acme.com", role: "member" },
      { name: "Alex Kim", email: "alex@acme.com", role: "member" }
    ];
    
    const userIds = [];
    for (const user of users) {
      const [result] = await db.query(
        "INSERT INTO users (name, email, password_hash, role, company_id) VALUES (?, ?, ?, ?, ?)",
        [user.name, user.email, passwordHash, user.role, companyId]
      );
      userIds.push(result.insertId);
    }
    
    console.log("Users created!");
    
    // Insert workflows
    const workflows = [
      { name: "Employee Onboarding", description: "Complete onboarding process for new hires", status: "active", priority: "high", category: "HR", due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      { name: "Invoice Processing", description: "Monthly invoice approval workflow", status: "active", priority: "medium", category: "Finance", due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { name: "Client Onboarding", description: "New client setup and welcome process", status: "completed", priority: "high", category: "Sales", due_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { name: "Q4 Planning", description: "Quarterly planning and goal setting", status: "on_hold", priority: "medium", category: "Operations", due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
      { name: "Product Launch", description: "Marketing and sales enablement", status: "active", priority: "high", category: "Marketing", due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) }
    ];
    
    const workflowIds = [];
    for (const workflow of workflows) {
      const [result] = await db.query(
        "INSERT INTO workflows (name, description, status, priority, category, company_id, created_by, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [workflow.name, workflow.description, workflow.status, workflow.priority, workflow.category, companyId, userIds[0], workflow.due_date]
      );
      workflowIds.push(result.insertId);
    }
    
    console.log("Workflows created!");
    
    // Insert tasks for Employee Onboarding
    const onboardingTasks = [
      { title: "Send welcome email", description: "Send personalized welcome email", priority: "high", status: "done", assigned: userIds[1] },
      { title: "Setup workstation", description: "Prepare laptop and software", priority: "high", status: "done", assigned: userIds[2] },
      { title: "Create accounts", description: "Setup email and Slack accounts", priority: "high", status: "in_progress", assigned: userIds[1] },
      { title: "Schedule orientation", description: "Book orientation meeting", priority: "medium", status: "done", assigned: userIds[1] },
      { title: "Assign buddy", description: "Pair with team buddy", priority: "medium", status: "todo", assigned: userIds[0] },
      { title: "Prepare documentation", description: "Gather onboarding documents", priority: "medium", status: "in_progress", assigned: userIds[3] },
      { title: "Schedule training", description: "Book training sessions", priority: "medium", status: "todo", assigned: userIds[1] },
      { title: "Team introduction", description: "Introduce to team", priority: "low", status: "todo", assigned: userIds[1] },
      { title: "Benefits enrollment", description: "Help with benefits", priority: "high", status: "todo", assigned: userIds[4] },
      { title: "Final check", description: "Verify all items completed", priority: "medium", status: "todo", assigned: userIds[0] }
    ];
    
    for (const task of onboardingTasks) {
      const [result] = await db.query(
        "INSERT INTO tasks (title, description, priority, status, workflow_id, assigned_to) VALUES (?, ?, ?, ?, ?, ?)",
        [task.title, task.description, task.priority, task.status, workflowIds[0], task.assigned]
      );
      
      await db.query(
        "INSERT INTO task_status_logs (task_id, old_status, new_status, changed_by) VALUES (?, NULL, ?, ?)",
        [result.insertId, task.status, userIds[0]]
      );
    }
    
    // Insert tasks for Invoice Processing
    const invoiceTasks = [
      { title: "Receive invoice", description: "Receive and log invoice", priority: "high", status: "done", assigned: userIds[2] },
      { title: "Verify details", description: "Verify against PO", priority: "high", status: "done", assigned: userIds[2] },
      { title: "Manager approval", description: "Get approval", priority: "high", status: "in_progress", assigned: userIds[0] },
      { title: "Process payment", description: "Process payment", priority: "high", status: "todo", assigned: userIds[4] },
      { title: "File invoice", description: "File for records", priority: "low", status: "todo", assigned: userIds[2] }
    ];
    
    for (const task of invoiceTasks) {
      const [result] = await db.query(
        "INSERT INTO tasks (title, description, priority, status, workflow_id, assigned_to) VALUES (?, ?, ?, ?, ?, ?)",
        [task.title, task.description, task.priority, task.status, workflowIds[1], task.assigned]
      );
      
      await db.query(
        "INSERT INTO task_status_logs (task_id, old_status, new_status, changed_by) VALUES (?, NULL, ?, ?)",
        [result.insertId, task.status, userIds[0]]
      );
    }
    
    // Insert tasks for Q4 Planning
    const planningTasks = [
      { title: "Gather data", description: "Collect Q3 data", priority: "medium", status: "done", assigned: userIds[4] },
      { title: "Draft goals", description: "Draft Q4 goals", priority: "high", status: "in_progress", assigned: userIds[4] },
      { title: "Team feedback", description: "Collect feedback", priority: "medium", status: "todo", assigned: userIds[4] },
      { title: "Finalize plan", description: "Finalize plan", priority: "high", status: "todo", assigned: userIds[0] }
    ];
    
    for (const task of planningTasks) {
      const [result] = await db.query(
        "INSERT INTO tasks (title, description, priority, status, workflow_id, assigned_to) VALUES (?, ?, ?, ?, ?, ?)",
        [task.title, task.description, task.priority, task.status, workflowIds[3], task.assigned]
      );
      
      await db.query(
        "INSERT INTO task_status_logs (task_id, old_status, new_status, changed_by) VALUES (?, NULL, ?, ?)",
        [result.insertId, task.status, userIds[0]]
      );
    }
    
    // Insert sample comments
    const [taskForComment] = await db.query("SELECT id FROM tasks WHERE title = 'Create accounts' LIMIT 1");
    if (taskForComment.length > 0) {
      await db.query(
        "INSERT INTO task_comments (task_id, user_id, comment) VALUES (?, ?, ?)",
        [taskForComment[0].id, userIds[1], "Email account has been created, waiting for IT setup"]
      );
    }
    
    console.log("Tasks and logs created!");
    console.log("\n✅ Database seeded successfully!");
    console.log("\nLogin credentials:");
    console.log("  Email: john@acme.com");
    console.log("  Password: password123");
    
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    process.exit(0);
  }
}

seed();
