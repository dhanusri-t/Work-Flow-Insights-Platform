import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import workflowRoutes from "./routes/workflow.routes.js";
import taskRoutes from "./routes/task.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();

// ── Security & Logging Middleware ──────────────────────────────────────────────
app.use(helmet());                          // Sets secure HTTP headers
app.use(morgan("dev"));                     // Logs: method, route, status, response time

// ── Body Parsing ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ── Health Check ───────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global Error Handler ───────────────────────────────────────────────────────
// Must have 4 params for Express to treat it as error middleware
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url} →`, err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || "Internal Server Error",
  });
});

export default app;