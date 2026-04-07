import { useState, useEffect, useRef } from "react";
import {
  User, Users, Shield, Bell, Building2,
  Mail, Plus, Trash2, ChevronDown, Check,
  Loader2, X, Eye, EyeOff, CheckCircle2,
  AlertCircle, Copy, RefreshCw, Crown,
} from "lucide-react";
import Avatar from "../components/Avatar";
import { teamAPI } from "../api/api";
import api from "../api/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = [
  { value: "admin",   label: "Admin",   desc: "Full access",           color: "#7c3aed", bg: "#ede9fe" },
  { value: "manager", label: "Manager", desc: "Manage workflows",      color: "#1d4ed8", bg: "#dbeafe" },
  { value: "member",  label: "Member",  desc: "Work on tasks",         color: "#047857", bg: "#d1fae5" },
  { value: "viewer",  label: "Viewer",  desc: "View only",             color: "#6b7280", bg: "#f3f4f6" },
];

const DEPARTMENTS = ["Engineering","Design","Marketing","Product","Sales","Operations","HR"];

const TABS = [
  { key: "profile",  label: "Profile",       icon: User      },
  { key: "members",  label: "Members",        icon: Users     },
  { key: "security", label: "Security",       icon: Shield    },
  { key: "workspace",label: "Workspace",      icon: Building2 },
];

function RolePill({ role }) {
  const r = ROLES.find(x => x.value === role?.toLowerCase()) || ROLES[2];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold"
      style={{ background: r.bg, color: r.color }}>
      {r.label}
    </span>
  );
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium
      ${type === "success" ? "bg-white border-emerald-200 text-emerald-700" : "bg-white border-red-200 text-red-600"}`}
      style={{ animation: "slideUp 0.2s ease" }}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
      {type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {message}
      <button onClick={onClose} className="ml-1 opacity-50 hover:opacity-100"><X size={13} /></button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Settings() {
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  })();
  const isAdmin   = currentUser?.role === "admin";
  const isManager = currentUser?.role === "manager";

  const [tab, setTab]     = useState("profile");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account, workspace, and team members</p>
      </div>

      {/* Settings layout: left nav + content */}
      <div className="flex gap-6 items-start">

        {/* Left nav */}
        <nav className="w-52 shrink-0 bg-white rounded-2xl border border-gray-200 p-2"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          {TABS.map(t => {
            // Hide members tab from viewers
            if (t.key === "members" && !isAdmin && !isManager) return null;
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5
                  ${active ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                <Icon size={16} className={active ? "text-indigo-600" : "text-gray-400"} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Content panel */}
        <div className="flex-1 min-w-0">
          {tab === "profile"   && <ProfileTab   user={currentUser} showToast={showToast} />}
          {tab === "members"   && <MembersTab   currentUser={currentUser} isAdmin={isAdmin} isManager={isManager} showToast={showToast} />}
          {tab === "security"  && <SecurityTab  showToast={showToast} />}
          {tab === "workspace" && <WorkspaceTab isAdmin={isAdmin} showToast={showToast} />}
        </div>
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab({ user, showToast }) {
  const [form, setForm]       = useState({ name: user?.name || "", email: user?.email || "" });
  const [saving, setSaving]   = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 600)); // TODO: wire to PATCH /api/profile
    const updated = { ...user, name: form.name, email: form.email };
    localStorage.setItem("user", JSON.stringify(updated));
    setSaving(false);
    showToast("Profile updated successfully");
  };

  return (
    <div className="space-y-5">
      <Card title="Personal information" desc="Update your name and email address">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar row */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <Avatar name={form.name || "U"} size="lg" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{form.name || "—"}</p>
              <p className="text-xs text-gray-400 mt-0.5 capitalize">{user?.role || "member"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Full name">
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="field-input" placeholder="Your name" />
            </Field>
            <Field label="Email address">
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                type="email" className="field-input" placeholder="you@company.com" />
            </Field>
          </div>

          <div className="flex justify-end pt-2">
            <SaveButton saving={saving} />
          </div>
        </form>
      </Card>

      <Card title="Role & permissions" desc="Your current access level in Flowcraft">
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <Crown size={16} className="text-gray-400" />
            <div>
              <p className="text-sm font-semibold text-gray-900 capitalize">{user?.role || "member"}</p>
              <p className="text-xs text-gray-400">
                {user?.role === "admin"   && "Full access to all settings, members, and data"}
                {user?.role === "manager" && "Can create workflows, tasks, and invite members"}
                {user?.role === "member"  && "Can work on assigned tasks and update their status"}
                {user?.role === "viewer"  && "Read-only access to all workflows and tasks"}
              </p>
            </div>
          </div>
          <RolePill role={user?.role} />
        </div>
      </Card>
    </div>
  );
}

// ─── Members Tab ──────────────────────────────────────────────────────────────

function MembersTab({ currentUser, isAdmin, isManager, showToast }) {
  const [members, setMembers]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showInvite, setShowInvite]   = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const res = await teamAPI.getAll();
      setMembers(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await teamAPI.updateRole(id, role);
      setMembers(p => p.map(m => m.id === id ? { ...m, role } : m));
      showToast("Role updated");
    } catch { showToast("Failed to update role", "error"); }
  };

  const handleRemove = async (member) => {
    if (!window.confirm(`Remove ${member.name} from the workspace?`)) return;
    try {
      await teamAPI.remove(member.id);
      setMembers(p => p.filter(m => m.id !== member.id));
      showToast(`${member.name} removed`);
    } catch { showToast("Failed to remove member", "error"); }
  };

  const handleInviteSuccess = (result) => {
    setInviteResult(result);
    loadMembers();
  };

  return (
    <div className="space-y-5">

      {/* Invite success banner */}
      {inviteResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  {inviteResult.user.name} added to workspace
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Share these credentials so they can log in:
                </p>
                <div className="mt-3 space-y-1.5">
                  {[
                    { label: "Email",    value: inviteResult.user.email   },
                    { label: "Password", value: inviteResult.tempPassword },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-xs text-emerald-600 w-16">{label}</span>
                      <code className="flex-1 text-xs font-mono font-bold text-emerald-900 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg">
                        {value}
                      </code>
                      <button onClick={() => navigator.clipboard.writeText(value)}
                        className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-500 transition-colors">
                        <Copy size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setInviteResult(null)}
              className="p-1 text-emerald-400 hover:text-emerald-600">
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      <Card
        title={`Workspace members · ${members.length}`}
        desc="Manage who has access to your Flowcraft workspace"
        action={
          (isAdmin || isManager) && (
            <button onClick={() => setShowInvite(p => !p)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-indigo-200">
              <Plus size={15} />
              Add member
            </button>
          )
        }>

        {/* Inline invite form */}
        {showInvite && (
          <InviteForm
            isAdmin={isAdmin}
            onSuccess={(result) => { handleInviteSuccess(result); setShowInvite(false); }}
            onCancel={() => setShowInvite(false)}
            showToast={showToast}
          />
        )}

        {/* Members list */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={22} className="animate-spin text-indigo-400" />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map(m => (
              <MemberRow
                key={m.id}
                member={m}
                isAdmin={isAdmin}
                isSelf={m.id === currentUser?.id}
                onRoleChange={handleRoleChange}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Inline Invite Form ───────────────────────────────────────────────────────

function InviteForm({ isAdmin, onSuccess, onCancel, showToast }) {
  const [form, setForm]     = useState({ name: "", email: "", role: "member", department: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const nameRef             = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await teamAPI.invite(form);
      onSuccess(res.data);
      showToast(`${form.name} added to workspace`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add member. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-5 p-5 bg-indigo-50/60 border border-indigo-100 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-indigo-900">Add new member</p>
        <button onClick={onCancel} className="p-1 rounded-lg text-indigo-300 hover:text-indigo-500">
          <X size={15} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl mb-4">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Row 1: name + email */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full name *</label>
            <input ref={nameRef} required value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Jane Smith"
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Work email *</label>
            <input required type="email" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="jane@company.com"
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10" />
          </div>
        </div>

        {/* Row 2: role + dept */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-indigo-400">
              {ROLES
                .filter(r => isAdmin || !["admin","manager"].includes(r.value))
                .map(r => (
                  <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Department</label>
            <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-indigo-400">
              <option value="">Select department…</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Role description hint */}
        {form.role && (
          <p className="text-xs text-gray-500 mb-4 px-1">
            <span className="font-semibold capitalize">{form.role}:</span>{" "}
            {ROLES.find(r => r.value === form.role)?.desc}
            {form.role === "admin"   && " — can manage all settings, members, and delete data"}
            {form.role === "manager" && " — can create/edit workflows, tasks, and invite members"}
            {form.role === "member"  && " — can update tasks assigned to them"}
            {form.role === "viewer"  && " — cannot make any changes"}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving || !form.name || !form.email}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium disabled:opacity-60 transition-colors">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {saving ? "Adding…" : "Add member"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────

function MemberRow({ member, isAdmin, isSelf, onRoleChange, onRemove }) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowRoleMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const joinedAt = member.joined_at
    ? new Date(member.joined_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  return (
    <div className="flex items-center gap-4 py-3.5 group">
      {/* Avatar + name */}
      <Avatar name={member.name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
          {isSelf && (
            <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-500">you</span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">{member.email}</p>
      </div>

      {/* Joined date */}
      <p className="text-xs text-gray-400 hidden sm:block w-20 text-right">{joinedAt}</p>

      {/* Role dropdown */}
      <div className="relative" ref={ref}>
        {isAdmin && !isSelf ? (
          <button onClick={() => setShowRoleMenu(p => !p)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-xs font-semibold"
            style={{ color: ROLES.find(r => r.value === member.role)?.color }}>
            {ROLES.find(r => r.value === member.role)?.label || member.role}
            <ChevronDown size={12} className="text-gray-400" />
          </button>
        ) : (
          <RolePill role={member.role} />
        )}

        {showRoleMenu && (
          <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl border border-gray-200 shadow-lg z-20 overflow-hidden py-1">
            {ROLES.map(r => (
              <button key={r.value} onClick={() => { onRoleChange(member.id, r.value); setShowRoleMenu(false); }}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors text-left">
                <div>
                  <p className="text-sm font-semibold" style={{ color: r.color }}>{r.label}</p>
                  <p className="text-xs text-gray-400">{r.desc}</p>
                </div>
                {member.role === r.value && <Check size={14} className="text-indigo-500 shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Remove button — only for admins, not self */}
      {isAdmin && !isSelf ? (
        <button onClick={() => onRemove(member)}
          className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
          <Trash2 size={14} />
        </button>
      ) : (
        <div className="w-7" /> // spacer to keep alignment
      )}
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab({ showToast }) {
  const [form, setForm]     = useState({ current: "", next: "", confirm: "" });
  const [show, setShow]     = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.next !== form.confirm) { setError("New passwords don't match"); return; }
    if (form.next.length < 6)       { setError("Password must be at least 6 characters"); return; }
    setSaving(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: form.current,
        newPassword:     form.next,
      });
      setForm({ current: "", next: "", confirm: "" });
      showToast("Password changed successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card title="Change password" desc="Update your password to keep your account secure">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {[
            { key: "current", label: "Current password",  placeholder: "••••••••" },
            { key: "next",    label: "New password",       placeholder: "Min. 6 characters" },
            { key: "confirm", label: "Confirm new password", placeholder: "••••••••" },
          ].map(({ key, label, placeholder }) => (
            <Field key={key} label={label}>
              <div className="relative">
                <input
                  type={show[key] ? "text" : "password"}
                  value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="field-input pr-10"
                  required
                />
                <button type="button" onClick={() => setShow(p => ({ ...p, [key]: !p[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
          ))}
          <div className="flex justify-end pt-2">
            <SaveButton saving={saving} label="Update password" />
          </div>
        </form>
      </Card>

      <Card title="Login methods" desc="Ways you can sign in to Flowcraft">
        <div className="space-y-3">
          {[
            { icon: Mail, label: "Email & password", desc: "Sign in with your work email and password", active: true },
            {
              icon: () => (
                <svg width="16" height="16" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              ),
              label: "Google", desc: "Sign in with your Google account", active: true
            },
          ].map(({ icon: Icon, label, desc, active }) => (
            <div key={label} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Icon size={16} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                {active ? "Connected" : "Not set up"}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Workspace Tab ────────────────────────────────────────────────────────────

function WorkspaceTab({ isAdmin, showToast }) {
  const [name, setName]   = useState("Acme Corporation");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 600)); // TODO: wire to PATCH /api/company
    setSaving(false);
    showToast("Workspace updated");
  };

  return (
    <div className="space-y-5">
      <Card title="Workspace settings" desc="Configure your company workspace">
        <form onSubmit={handleSave} className="space-y-4 max-w-sm">
          <Field label="Workspace name">
            <input value={name} onChange={e => setName(e.target.value)}
              disabled={!isAdmin}
              className="field-input disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Company name" />
          </Field>
          {isAdmin && (
            <div className="flex justify-end pt-2">
              <SaveButton saving={saving} />
            </div>
          )}
          {!isAdmin && (
            <p className="text-xs text-gray-400">Only admins can change the workspace name.</p>
          )}
        </form>
      </Card>

      {isAdmin && (
        <Card title="Danger zone" desc="Irreversible actions for this workspace">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-semibold text-red-600">Delete workspace</p>
              <p className="text-xs text-gray-400 mt-0.5">Permanently delete this workspace and all its data</p>
            </div>
            <button className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors">
              Delete workspace
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function Card({ title, desc, action, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <p className="text-sm font-bold text-gray-900">{title}</p>
          {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
        </div>
        {action}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function SaveButton({ saving, label = "Save changes" }) {
  return (
    <button type="submit" disabled={saving}
      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium disabled:opacity-60 transition-colors">
      {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
      {saving ? "Saving…" : label}
    </button>
  );
}

// Add to global CSS (or Tailwind config) — field-input utility
const style = document.createElement("style");
style.textContent = `.field-input{width:100%;padding:0.625rem 0.875rem;background:#f9fafb;border:1px solid #e5e7eb;border-radius:0.75rem;font-size:0.875rem;color:#1f2937;outline:none;transition:border-color 0.15s,box-shadow 0.15s}.field-input::placeholder{color:#9ca3af}.field-input:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,0.08)}`;
if (!document.head.querySelector("[data-settings-styles]")) {
  style.setAttribute("data-settings-styles","");
  document.head.appendChild(style);
}