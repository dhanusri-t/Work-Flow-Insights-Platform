import { useState, useEffect } from "react";
import { authAPI } from "../api/api";

/**
 * useRole()
 * Returns the current logged-in user's role and info.
 *
 * Usage:
 *   const { role, isAdmin, isManager, canEdit, user } = useRole();
 */
export function useRole() {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to read from localStorage first (fast)
    const cached = localStorage.getItem("user");
    if (cached) {
      try { setUser(JSON.parse(cached)); } catch {}
    }

    // Always verify with backend
    authAPI.me()
      .then(res => {
        const u = res.data.user || res.data;
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const role = user?.role?.toLowerCase() || "viewer";

  return {
    user,
    role,
    loading,
    isAdmin:   role === "admin",
    isManager: role === "manager",
    isMember:  role === "member",
    isViewer:  role === "viewer",

    // Convenience permission checks
    canCreate:       ["admin", "manager"].includes(role),
    canEdit:         ["admin", "manager"].includes(role),
    canDelete:       role === "admin",
    canAssign:       ["admin", "manager"].includes(role),
    canManageRoles:  role === "admin",
    canViewAll:      ["admin", "manager"].includes(role),
  };
}