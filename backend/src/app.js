import express    from "express";
import cors       from "cors";
import helmet     from "helmet";
import morgan     from "morgan";
import rateLimit  from "express-rate-limit";
import passport   from "./config/passport.js";

import authRoutes      from "./routes/auth.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import workflowRoutes  from "./routes/workflow.routes.js";
import taskRoutes      from "./routes/task.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();

// ── Security & Logging ─────────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan("dev"));

// ── CORS ───────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

// ── Body Parsing ───────────────────────────────────────────────────────────────
app.use(express.json());

// ── Passport ───────────────────────────────────────────────────────────────────
app.use(passport.initialize());

// ── Rate Limiters ──────────────────────────────────────────────────────────────

// 1. Login — 5 failed attempts per IP per 15 min (brute-force protection)
const authLimiter = rateLimit({
  windowMs:               15 * 60 * 1000,
  max:                    5,
  skipSuccessfulRequests: true,
  standardHeaders:        true,
  legacyHeaders:          false,
  message: { status: 429, message: "Too many login attempts. Please wait 15 minutes before trying again." },
});

// 2. Sensitive ops — role changes & member removal: 20 per IP per 10 min
const sensitiveOpsLimiter = rateLimit({
  windowMs:        10 * 60 * 1000,
  max:             20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { status: 429, message: "Too many requests for this operation. Please wait and try again." },
});

// 3. General API — 100 requests per IP per minute
const apiLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { status: 429, message: "Too many requests. Please slow down." },
});

// ── Apply Rate Limiters ────────────────────────────────────────────────────────
// Order matters — specific routes must come before the general /api catch-all
app.use("/api/login",                   authLimiter);
app.use("/api/dashboard/team/:id/role", sensitiveOpsLimiter);
// Only apply sensitive limiter to numeric :id paths — never to /team/invite
app.use((req, res, next) => {
  const match = req.path.match(/^\/api\/dashboard\/team\/([^/]+)(\/|$)/);

  if (
    match &&
    match[1] !== "invite" &&
    /^\d+$/.test(match[1])
  ) {
    return sensitiveOpsLimiter(req, res, next);
  }

  next();
});
app.use("/api",                         apiLimiter);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api",            authRoutes);
app.use("/api",            protectedRoutes);
app.use("/api/workflows",  workflowRoutes);
app.use("/api/tasks",      taskRoutes);
app.use("/api/dashboard",  dashboardRoutes);

// ── Health Check ───────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url} →`, err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || "Internal Server Error",
  });
});

export default app;