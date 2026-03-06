-- Database Schema for Workflow Monitoring System
-- Run this SQL in your MySQL database to create all required tables

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS workflow_monitoring;
USE workflow_monitoring;

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'member') DEFAULT 'member',
  company_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
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
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
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
);

-- Task status logs table
CREATE TABLE IF NOT EXISTS task_status_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by INT NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Task reviews table
CREATE TABLE IF NOT EXISTS task_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  review_status ENUM('approved', 'rejected') NOT NULL,
  comments TEXT,
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Task comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample data
INSERT INTO companies (name) VALUES 
  ('Acme Corporation'),
  ('Tech Startup Inc');

-- Password is 'password123' for all users (hashed with bcrypt)
-- Insert sample users (password: password123)
INSERT INTO users (name, email, password_hash, role, company_id) VALUES 
  ('John Admin', 'john@acme.com', '$2b$10$rKY5vZ5Q5G5K5K5K5K5K5eu6F6F6F6F6F6F6F6F6F6F6F6F6F6F6F', 'admin', 1),
  ('Sarah Chen', 'sarah@acme.com', '$2b$10$rKY5vZ5Q5G5K5K5K5K5K5eu6F6F6F6F6F6F6F6F6F6F6F6F6F6F', 'member', 1),
  ('Mike Johnson', 'mike@acme.com', '$2b$10$rKY5vZ5Q5G5K5K5K5K5K5eu6F6F6F6F6F6F6F6F6F6F6F6F6F6F', 'member', 1),
  ('Emily Davis', 'emily@acme.com', '$2b$10$rKY5vZ5Q5G5K5K5K5K5K5eu6F6F6F6F6F6F6F6F6F6F6F6F6F6F', 'member', 1),
  ('Alex Kim', 'alex@acme.com', '$2b$10$rKY5vZ5Q5G5K5K5K5K5K5eu6F6F6F6F6F6F6F6F6F6F6F6F6F6F', 'member', 1);

-- Insert sample workflows
INSERT INTO workflows (name, description, status, priority, category, company_id, created_by, due_date) VALUES 
  ('Employee Onboarding', 'Complete onboarding process for new hires including documentation, training, and team introductions', 'active', 'high', 'HR', 1, 1, DATE_ADD(CURDATE(), INTERVAL 30 DAY)),
  ('Invoice Processing', 'Monthly invoice approval workflow for vendor payments', 'active', 'medium', 'Finance', 1, 1, DATE_ADD(CURDATE(), INTERVAL 7 DAY)),
  ('Client Onboarding', 'New client setup and welcome process with account creation', 'completed', 'high', 'Sales', 1, 1, DATE_ADD(CURDATE(), INTERVAL -7 DAY)),
  ('Q4 Planning', 'Quarterly planning and goal setting for the operations team', 'on_hold', 'medium', 'Operations', 1, 1, DATE_ADD(CURDATE(), INTERVAL 14 DAY)),
  ('Product Launch', 'Marketing and sales enablement for new product release', 'active', 'high', 'Marketing', 1, 1, DATE_ADD(CURDATE(), INTERVAL 21 DAY));

-- Insert sample tasks for Employee Onboarding workflow
INSERT INTO tasks (title, description, priority, status, workflow_id, assigned_to) VALUES
  ('Send welcome email', 'Send personalized welcome email to new hire', 'high', 'done', 1, 2),
  ('Setup workstation', 'Prepare laptop and all required software', 'high', 'done', 1, 3),
  ('Create accounts', 'Setup email, Slack, and project management accounts', 'high', 'in_progress', 1, 2),
  ('Schedule orientation', 'Book orientation meeting with HR', 'medium', 'done', 1, 2),
  ('Assign buddy', 'Pair new hire with a team buddy', 'medium', 'todo', 1, 1),
  ('Prepare documentation', 'Gather all required onboarding documents', 'medium', 'in_progress', 1, 4),
  ('Schedule training', 'Book required training sessions', 'medium', 'todo', 1, 2),
  ('Team introduction', 'Send introduction email to team', 'low', 'todo', 1, 2),
  ('Benefits enrollment', 'Help with benefits paperwork', 'high', 'todo', 1, 5),
  ('Final check', 'Verify all onboarding items completed', 'medium', 'todo', 1, 1);

-- Insert sample tasks for Invoice Processing workflow
INSERT INTO tasks (title, description, priority, status, workflow_id, assigned_to) VALUES
  ('Receive invoice', 'Receive and log incoming invoice', 'high', 'done', 2, 3),
  ('Verify details', 'Verify invoice details against purchase order', 'high', 'done', 2, 3),
  ('Manager approval', 'Get manager approval for payment', 'high', 'in_progress', 2, 1),
  ('Process payment', 'Process payment to vendor', 'high', 'todo', 2, 5),
  ('File invoice', 'File invoice for record keeping', 'low', 'todo', 2, 3);

-- Insert sample tasks for Q4 Planning workflow
INSERT INTO tasks (title, description, priority, status, workflow_id, assigned_to) VALUES
  ('Gather data', 'Collect performance data from Q3', 'medium', 'done', 4, 5),
  ('Draft goals', 'Draft preliminary goals for Q4', 'high', 'in_progress', 4, 5),
  ('Team feedback', 'Collect feedback from team leads', 'medium', 'todo', 4, 5),
  ('Finalize plan', 'Finalize Q4 plan', 'high', 'todo', 4, 1);

-- Insert task status logs
INSERT INTO task_status_logs (task_id, old_status, new_status, changed_by) VALUES
  (1, NULL, 'todo', 1),
  (1, 'todo', 'done', 2),
  (2, NULL, 'todo', 1),
  (2, 'todo', 'done', 3),
  (3, NULL, 'todo', 1),
  (3, 'todo', 'in_progress', 2),
  (11, NULL, 'todo', 1),
  (11, 'todo', 'done', 3),
  (12, NULL, 'todo', 1),
  (12, 'todo', 'done', 3),
  (13, NULL, 'todo', 1),
  (13, 'todo', 'in_progress', 1);

-- Insert sample task comments
INSERT INTO task_comments (task_id, user_id, comment) VALUES
  (3, 2, 'Email account has been created, waiting for IT to setup Slack'),
  (6, 4, 'Documents are being prepared, will be ready by EOD'),
  (13, 1, 'Please review the invoice for accuracy');
