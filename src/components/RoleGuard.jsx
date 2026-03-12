import { useRole } from "../hooks/useRole";

/**
 * <RoleGuard> — Show children only if the user has the required role.
 *
 * Props:
 *   allow   {string|string[]}  — role(s) that can see this content
 *   deny    {string|string[]}  — role(s) that cannot see this content
 *   fallback {ReactNode}       — optional: what to show if access denied (default: nothing)
 *
 * Examples:
 *
 *   // Only admin sees this button
 *   <RoleGuard allow="admin">
 *     <button>Delete Workflow</button>
 *   </RoleGuard>
 *
 *   // Admin and manager see this
 *   <RoleGuard allow={["admin", "manager"]}>
 *     <button>Create Workflow</button>
 *   </RoleGuard>
 *
 *   // Hide from viewers, show to everyone else
 *   <RoleGuard deny="viewer">
 *     <button>Edit Task</button>
 *   </RoleGuard>
 *
 *   // Show fallback to unauthorized users
 *   <RoleGuard allow="admin" fallback={<p>Admin only</p>}>
 *     <AdminPanel />
 *   </RoleGuard>
 */
export function RoleGuard({ allow, deny, fallback = null, children }) {
  const { role, loading } = useRole();

  if (loading) return null;

  // Check deny list first
  if (deny) {
    const denyList = Array.isArray(deny) ? deny : [deny];
    if (denyList.includes(role)) return fallback;
  }

  // Check allow list
  if (allow) {
    const allowList = Array.isArray(allow) ? allow : [allow];
    if (!allowList.includes(role)) return fallback;
  }

  return children;
}

/**
 * <AdminOnly> — Shorthand for <RoleGuard allow="admin">
 */
export function AdminOnly({ children, fallback = null }) {
  return <RoleGuard allow="admin" fallback={fallback}>{children}</RoleGuard>;
}

/**
 * <ManagerAndAbove> — Shorthand for admin + manager
 */
export function ManagerAndAbove({ children, fallback = null }) {
  return <RoleGuard allow={["admin", "manager"]} fallback={fallback}>{children}</RoleGuard>;
}

/**
 * <NotViewer> — Hide from viewers only
 */
export function NotViewer({ children, fallback = null }) {
  return <RoleGuard deny="viewer" fallback={fallback}>{children}</RoleGuard>;
}