// ─── Role Hierarchy ───────────────────────────────────────────────────────────
// admin > manager > member > viewer

export const ROLES = {
  ADMIN:   "admin",
  MANAGER: "manager",
  MEMBER:  "member",
  VIEWER:  "viewer",
};

// Role power level — higher = more access
const ROLE_LEVEL = {
  admin:   4,
  manager: 3,
  member:  2,
  viewer:  1,
};

/**
 * requireRole(...roles)
 * Blocks the request if the user's role is not in the allowed list.
 *
 * Usage:
 *   router.delete("/:id", authenticate, requireRole("admin"), handler)
 *   router.post("/",      authenticate, requireRole("admin","manager"), handler)
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role?.toLowerCase();

    if (!userRole) {
      return res.status(401).json({ error: "Unauthorized — no role found" });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `This action requires one of: ${allowedRoles.join(", ")}. Your role: ${userRole}`,
      });
    }

    next();
  };
};

/**
 * requireMinRole(role)
 * Blocks the request if the user's role level is below the minimum.
 * Useful when you want "manager and above" without listing every role.
 *
 * Usage:
 *   router.post("/", authenticate, requireMinRole("manager"), handler)
 *   // allows: admin, manager — blocks: member, viewer
 */
export const requireMinRole = (minRole) => {
  return (req, res, next) => {
    const userRole = req.user?.role?.toLowerCase();

    if (!userRole) {
      return res.status(401).json({ error: "Unauthorized — no role found" });
    }

    const userLevel = ROLE_LEVEL[userRole]   || 0;
    const minLevel  = ROLE_LEVEL[minRole]    || 0;

    if (userLevel < minLevel) {
      return res.status(403).json({
        error: "Forbidden",
        message: `This action requires at least ${minRole} role. Your role: ${userRole}`,
      });
    }

    next();
  };
};

/**
 * requireSelfOrRole(role)
 * Allows the action if the user is modifying their own resource,
 * OR if they have the required role.
 *
 * Usage:
 *   router.put("/users/:id", authenticate, requireSelfOrRole("admin"), handler)
 */
export const requireSelfOrRole = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role?.toLowerCase();
    const userId   = req.user?.userId;
    const paramId  = parseInt(req.params.id);

    // Allow if it's the user's own resource
    if (userId === paramId) return next();

    // Allow if role matches
    if (allowedRoles.includes(userRole)) return next();

    return res.status(403).json({
      error: "Forbidden",
      message: "You can only modify your own data or need elevated permissions",
    });
  };
};