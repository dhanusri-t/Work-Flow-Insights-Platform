import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: process.env.DB_PW ,
  database: "workflow_monitoring",
});