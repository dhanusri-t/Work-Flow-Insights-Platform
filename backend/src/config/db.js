import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "sri@1306",
  database: "workflow_monitoring",
});