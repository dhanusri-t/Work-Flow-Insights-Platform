import { useState, useEffect } from "react";
import {
  UserPlus, Mail, X, Loader2, Users, Search,
  CheckCircle2, Send, ChevronDown, ChevronRight,
  Briefcase, ListTodo, Activity,
  CheckCheck, Zap, Calendar, Trash2,
} from "lucide-react";
import Avatar from "../components/Avatar";
import Modal from "../components/Modal";
import { teamAPI } from "../api/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = [
  { value: "admin",   label: "Admin",   color: "#7c3aed", bg: "#ede9fe" },
  { value: "manager", label: "Manager", color: "#1d4ed8", bg: "#dbeafe" },
  { value: "member",  label: "Member",  color: "#047857", bg: "#d1fae5" },
  { value: "viewer",  label: "Viewer",  color: "#6b7280", bg: "#f3f4f6" },
];

const DEPARTMENTS = ["Engineering","Design","Marketing","Product","Sales","Operations","HR"];

const DEPT_COLORS = {
  Engineering: { dot: "#6366f1", light: "#eef2ff" },
  Design:      { dot: "#ec4899", light: "#fdf2f8" },
  Marketing:   { dot: "#f59e0b", light: "#fffbeb" },
  Product:     { dot: "#10b981", light: "#ecfdf5" },
  Sales:       { dot: "#ef4444", light: "#fef2f2" },
  Operations:  { dot: "#3b82f6", light: "#eff6ff" },
  HR:          { dot: "#8b5cf6", light: "#f5f3ff" },
};

const PENDING_DEFAULT = [
  { id: 1, email: "newdev@acme.com",   role: "member", department: "Engineering", sentAt: "2 days ago" },
  { id: 2, email: "designer@acme.com", role: "member", department: "Design",      sentAt: "5 days ago" },
];

const JOINED = ["Jan 2024","Mar 2024","Jun 2023","Nov 2023","Feb 2024","Aug 2023","Oct 2023"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RolePill({ role }) {
  const r = ROLES.find(x => x.value === role?.toLowerCase()) || ROLES[2];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
      style={{ background: r.bg, color: r.color }}>
      {r.label}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function WorkflowsBadge({ count }) {
  if (!count) return <span className="text-xs text-gray-400">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold text-indigo-600"
        style={{ background: "#eef2ff" }}>
        {count}
      </span>
      <span className="text-xs text-gray-500">{count === 1 ? "project" : "projects"}</span>
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Team() {
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  })();
  const isAdmin   = currentUser?.role === "admin";
  const isManager = currentUser?.role === "manager";

  const [loading, setLoading]       = useState(true);
  const [members, setMembers]       = useState([]);
  const [selected, setSelected]     = useState(null);
  const [search, setSearch]         = useState("");
  const [collapsed, setCollapsed]   = useState({});
  const [showInvite, setShowInvite]   = useState(false);
  const [inviteForm, setInviteForm]   = useState({ name: "", email: "", role: "member", department: "" });
  const [inviting, setInviting]       = useState(false);
  const [inviteResult, setInviteResult] = useState(null); // holds { user, tempPassword } after success
  const [inviteError, setInviteError]   = useState("");
  const [pending, setPending]         = useState(PENDING_DEFAULT);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await teamAPI.getAll();
      const enriched = (res.data || []).map((m, i) => ({
        ...m,
        department:     DEPARTMENTS[i % DEPARTMENTS.length],
        joinedAt:       m.joined_at ? formatDate(m.joined_at) : JOINED[i % JOINED.length],
        totalTasks:     m.tasks?.total     ?? m.tasks     ?? 0,
        completedTasks: m.tasks?.completed ?? m.completed ?? 0,
        activeTasks:    m.tasks?.active    ?? 0,
        workflows:      m.workflows        ?? 0,
      }));
      setMembers(enriched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    // Optimistic update
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    setSelected(s => s?.id === memberId ? { ...s, role: newRole } : s);
    try {
      await teamAPI.updateRole(memberId, newRole);
    } catch (e) {
      console.error(e);
      load(); // revert on failure
    }
  };

  const handleRemove = async (memberId) => {
    if (!window.confirm("Remove this member from the team?")) return;
    try {
      await teamAPI.remove(memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      if (selected?.id === memberId) setSelected(null);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleCollapse = (dept) => setCollapsed(p => ({ ...p, [dept]: !p[dept] }));

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setInviteError("");
    try {
      const res = await teamAPI.invite({
        name:       inviteForm.name,
        email:      inviteForm.email,
        role:       inviteForm.role,
        department: inviteForm.department,
      });
      // Show the success screen with temp password
      setInviteResult(res.data);
      // Also add to pending list for the invitations tab
      setPending(p => [...p, {
        id:         res.data.user.id,
        email:      res.data.user.email,
        role:       res.data.user.role,
        department: inviteForm.department,
        sentAt:     "Just now",
      }]);
      // Refresh member list so new user appears
      load();
    } catch (err) {
      setInviteError(err.response?.data?.message || "Failed to invite member. Please try again.");
    } finally {
      setInviting(false);
    }
  };

  const closeInviteModal = () => {
    setShowInvite(false);
    setInviteResult(null);
    setInviteError("");
    setInviteForm({ name: "", email: "", role: "member", department: "" });
  };

  const filtered = members.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.department?.toLowerCase().includes(q)
    );
  });

  const grouped = DEPARTMENTS.reduce((acc, dept) => {
    const list = filtered.filter(m => m.department === dept);
    if (list.length) acc[dept] = list;
    return acc;
  }, {});

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {members.length} people · {Object.keys(grouped).length} departments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              type="text" placeholder="Search members…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-sm outline-none text-gray-700 placeholder-gray-400 w-44 bg-transparent"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X size={12} className="text-gray-400" />
              </button>
            )}
          </div>
          {(isAdmin || isManager) && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/25">
              <UserPlus size={15} /> Invite
            </button>
          )}
        </div>
      </div>

      {/* ── Table + Side panel ── */}
      <div className="flex gap-5 items-start">

        {/* TABLE */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-200"
            style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>

            {/* Column headers */}
            <div
              className="grid bg-gray-50 rounded-t-2xl border-b border-gray-200 px-5 py-3"
              style={{ gridTemplateColumns: "2fr 0.9fr 1fr 1.8fr 1.4fr 1.2fr" }}>
              {["Name", "Role", "Projects", "Email", "Tasks", "Joined"].map(h => (
                <p key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</p>
              ))}
            </div>

            <div className="divide-y divide-gray-100">
              {Object.keys(grouped).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Users size={40} className="opacity-20 text-gray-400" />
                  <p className="text-sm text-gray-400">No members found</p>
                </div>
              ) : Object.entries(grouped).map(([dept, list]) => {
                const dc = DEPT_COLORS[dept] || { dot: "#6366f1", light: "#eef2ff" };
                const isCollapsed = collapsed[dept];

                return (
                  <div key={dept}>
                    {/* Dept header */}
                    <button
                      onClick={() => toggleCollapse(dept)}
                      className="w-full flex items-center gap-3 px-5 py-2.5 transition-colors hover:opacity-90"
                      style={{ background: dc.light }}>
                      {isCollapsed
                        ? <ChevronRight size={14} className="text-gray-400" />
                        : <ChevronDown  size={14} className="text-gray-400" />}
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dc.dot }} />
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-700">{dept}</span>
                      <span className="text-xs text-gray-400 ml-1">{list.length}</span>
                    </button>

                    {/* Member rows */}
                    {!isCollapsed && list.map(m => {
                      const isSelected = selected?.id === m.id;
                      const donePct = m.totalTasks > 0
                        ? Math.round((m.completedTasks / m.totalTasks) * 100) : 0;

                      return (
                        <div
                          key={m.id}
                          onClick={() => setSelected(isSelected ? null : m)}
                          className="grid items-center px-5 py-3 cursor-pointer transition-colors hover:bg-indigo-50/60 border-l-2"
                          style={{
                            gridTemplateColumns: "2fr 0.9fr 1fr 1.8fr 1.4fr 1.2fr",
                            borderLeftColor: isSelected ? "#6366f1" : "transparent",
                            background: isSelected ? "#f0f4ff" : undefined,
                          }}>

                          {/* Name */}
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={m.name} size="sm" />
                            <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                          </div>

                          {/* Role */}
                          <div><RolePill role={m.role} /></div>

                          {/* Projects */}
                          <div><WorkflowsBadge count={m.workflows} /></div>

                          {/* Email */}
                          <p className="text-sm text-gray-500 truncate pr-3">{m.email}</p>

                          {/* Tasks progress */}
                          <div className="flex items-center gap-2 pr-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-indigo-500 transition-all"
                                style={{ width: `${donePct}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 shrink-0">
                              {m.completedTasks}/{m.totalTasks}
                            </span>
                          </div>

                          {/* Joined */}
                          <p className="text-xs text-gray-400">{m.joinedAt}</p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SIDE PANEL */}
        {selected && (
          <div className="w-80 xl:w-96 shrink-0" style={{ animation: "slideIn 0.2s ease" }}>
            <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}`}</style>
            <MemberPanel
              member={selected}
              pending={pending}
              isAdmin={isAdmin}
              isManager={isManager}
              currentUserId={currentUser?.id}
              onClose={() => setSelected(null)}
              onRoleChange={handleRoleChange}
              onRemove={handleRemove}
              onCancelInvite={id => setPending(p => p.filter(x => x.id !== id))}
            />
          </div>
        )}
      </div>

      {/* INVITE MODAL */}
      <Modal isOpen={showInvite} onClose={closeInviteModal} title={inviteResult ? "Member Added" : "Invite Team Member"} size="md">

        {/* ── Success screen — show temp password ── */}
        {inviteResult ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900">{inviteResult.user.name} has been added</h3>
              <p className="text-sm text-gray-500 mt-1">{inviteResult.user.email} · <span className="capitalize">{inviteResult.user.role}</span></p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-2 uppercase tracking-wider">Temporary password — share with the member</p>
              <div className="flex items-center justify-between gap-3 bg-white border border-amber-200 rounded-lg px-4 py-2.5">
                <code className="text-base font-mono font-bold text-gray-900 tracking-widest">{inviteResult.tempPassword}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(inviteResult.tempPassword)}
                  className="text-xs text-amber-700 hover:text-amber-800 font-semibold shrink-0 px-2 py-1 rounded hover:bg-amber-100 transition-colors">
                  Copy
                </button>
              </div>
              <p className="text-xs text-amber-600 mt-2">The member should change this password after their first login.</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-700 mb-2">Share these login details:</p>
              <p>URL: <span className="font-mono text-gray-900">{window.location.origin}/login</span></p>
              <p>Email: <span className="font-mono text-gray-900">{inviteResult.user.email}</span></p>
              <p>Password: <span className="font-mono text-gray-900">{inviteResult.tempPassword}</span></p>
            </div>

            <button onClick={closeInviteModal}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
              Done
            </button>
          </div>
        ) : (
        /* ── Invite form ── */
        <form onSubmit={handleInvite} className="space-y-4">

          {inviteError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <X size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{inviteError}</p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name *</label>
            <input
              type="text" required placeholder="Jane Smith"
              value={inviteForm.name}
              onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Work email *</label>
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus-within:border-indigo-500 transition-colors">
              <Mail size={15} className="text-gray-400 shrink-0" />
              <input
                type="email" required placeholder="jane@company.com"
                value={inviteForm.email}
                onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <select
                value={inviteForm.role}
                onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-indigo-500">
                {ROLES.filter(r => isAdmin || !['admin','manager'].includes(r.value))
                  .map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
              <select
                value={inviteForm.department}
                onChange={e => setInviteForm({ ...inviteForm, department: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-indigo-500">
                <option value="">Select…</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={closeInviteModal}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit" disabled={inviting || !inviteForm.email || !inviteForm.name}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium disabled:opacity-60 flex items-center gap-2">
              {inviting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {inviting ? "Adding member…" : "Add Member"}
            </button>
          </div>
        </form>
        )}
      </Modal>
    </div>
  );
}

// ─── Member Detail Panel ──────────────────────────────────────────────────────

function MemberPanel({ member, pending, isAdmin, isManager, currentUserId, onClose, onRoleChange, onRemove, onCancelInvite }) {
  const [tab, setTab]           = useState("overview");
  const dc = DEPT_COLORS[member.department] || { dot: "#6366f1", light: "#eef2ff" };

  const total     = member.totalTasks     ?? 0;
  const completed = member.completedTasks ?? 0;
  const active    = member.activeTasks    ?? 0;
  const todo      = Math.max(0, total - completed - active);
  const donePct   = total > 0 ? Math.round((completed / total) * 100) : 0;

  const isSelf    = member.id === currentUserId;
  const canManage = isAdmin && !isSelf;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 flex flex-col"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-500">Member Profile</p>
        <div className="flex items-center gap-1">
          {canManage && (
            <button
              onClick={() => onRemove(member.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
              title="Remove member">
              <Trash2 size={15} />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Identity */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <Avatar name={member.name} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{member.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
              <Mail size={12} className="shrink-0" /> {member.email}
            </p>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <RolePill role={member.role} />
              <span className="px-2 py-0.5 rounded text-xs font-semibold"
                style={{ background: dc.light, color: dc.dot }}>
                {member.department}
              </span>
              <WorkflowsBadge count={member.workflows ?? 0} />
            </div>
          </div>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {[
          { key: "overview", label: "Overview" },
          { key: "invites",  label: `Invitations (${pending.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              tab === t.key
                ? "text-indigo-600 border-indigo-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: 460 }}>

        {tab === "overview" && (
          <>
            {/* Circle ring + 3 stat mini cards */}
            <div className="flex items-center gap-5 p-4 bg-gray-50 rounded-xl">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="7" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke={dc.dot} strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - donePct / 100)}`}
                    style={{ transition: "stroke-dashoffset 0.8s ease" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-bold text-gray-900 leading-none">{donePct}%</p>
                  <p className="text-xs text-gray-400">done</p>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2">
                {[
                  { label: "Total",  value: total,     color: "#374151" },
                  { label: "Done",   value: completed, color: dc.dot    },
                  { label: "Active", value: active,    color: "#f59e0b" },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-lg p-2.5 text-center border border-gray-100">
                    <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>


            {/* Details */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Details</p>
              <div className="divide-y divide-gray-50">
                {[
                  { icon: Briefcase, label: "Department", value: member.department || "—" },
                  { icon: Activity,  label: "Role",       value: <RolePill role={member.role} /> },
                  { icon: Calendar,  label: "Joined",     value: member.joinedAt || "—" },
                  { icon: Mail,      label: "Email",      value: <span className="text-xs text-gray-600 truncate max-w-[140px] inline-block">{member.email}</span> },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 gap-3">
                    <div className="flex items-center gap-2 shrink-0">
                      <Icon size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-500">{label}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "invites" && (
          <div className="space-y-2">
            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <CheckCircle2 size={36} className="opacity-30 text-gray-400" />
                <p className="text-sm text-gray-400">No pending invitations</p>
              </div>
            ) : pending.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                  <Mail size={13} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{inv.email}</p>
                  <p className="text-xs text-gray-400">{inv.department || "—"} · {inv.sentAt}</p>
                </div>
                <RolePill role={inv.role} />
                {isAdmin && (
                  <button onClick={() => onCancelInvite(inv.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors shrink-0">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}