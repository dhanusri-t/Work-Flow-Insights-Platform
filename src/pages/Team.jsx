import { useState, useEffect } from "react";
import {
  UserPlus, Mail, X, Loader2, Crown, Shield, Users, Star,
  Search, CheckCircle2, Send, ChevronDown, ChevronRight,
  CheckSquare, Clock, TrendingUp, Briefcase,
} from "lucide-react";
import Avatar from "../components/Avatar";
import Modal from "../components/Modal";
import { dashboardAPI } from "../api/api";

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

const JOINED    = ["Jan 2024","Mar 2024","Jun 2023","Nov 2023","Feb 2024","Aug 2023","Oct 2023"];

const pct = (done, total) => total > 0 ? Math.round((done / total) * 100) : 0;

// Completion tier — replaces status
function CompletionBadge({ completed, total }) {
  const rate = pct(completed, total);
  if (total === 0) return <span className="text-xs text-gray-400">No tasks</span>;
  const tier =
    rate === 100 ? { label: "All done",    color: "#059669", bg: "#d1fae5" } :
    rate >= 70   ? { label: "On track",    color: "#2563eb", bg: "#dbeafe" } :
    rate >= 40   ? { label: "In progress", color: "#d97706", bg: "#fef3c7" } :
                   { label: "Just started",color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
      style={{ background: tier.bg, color: tier.color }}>
      {tier.label}
    </span>
  );
}

function RolePill({ role }) {
  const r = ROLES.find(x => x.value === role?.toLowerCase()) || ROLES[2];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
      style={{ background: r.bg, color: r.color }}>
      {r.label}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Team() {
  const [loading, setLoading]       = useState(true);
  const [members, setMembers]       = useState([]);
  const [selected, setSelected]     = useState(null);
  const [search, setSearch]         = useState("");
  const [collapsed, setCollapsed]   = useState({});
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "member", department: "" });
  const [inviting, setInviting]     = useState(false);
  const [pending, setPending]       = useState(PENDING_DEFAULT);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getStats();
      const enriched = (res.data.teamMembers || []).map((m, i) => ({
        ...m,
        department: DEPARTMENTS[i % DEPARTMENTS.length],
        joinedAt:   JOINED[i % JOINED.length],
      }));
      setMembers(enriched);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleCollapse = (dept) => setCollapsed(p => ({ ...p, [dept]: !p[dept] }));

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    await new Promise(r => setTimeout(r, 800));
    setPending(p => [...p, { id: Date.now(), ...inviteForm, sentAt: "Just now" }]);
    setInviting(false);
    setShowInvite(false);
    setInviteForm({ email: "", role: "member", department: "" });
  };

  const filtered = members.filter(m => {
    if (!search) return true;
    return m.name?.toLowerCase().includes(search.toLowerCase()) ||
           m.email?.toLowerCase().includes(search.toLowerCase());
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
    <div className="flex gap-0 h-full" style={{ minHeight: "calc(100vh - 100px)" }}>

      {/* ── LEFT: TABLE ── */}
      <div className={`flex flex-col transition-all duration-300 ${selected ? "w-[55%]" : "w-full"}`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
            <p className="text-sm text-gray-500 mt-0.5">{members.length} people across {Object.keys(grouped).length} departments</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl">
              <Search size={14} className="text-gray-400" />
              <input type="text" placeholder="Search members..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-sm outline-none text-gray-700 placeholder-gray-400 w-44 bg-transparent" />
              {search && <button onClick={() => setSearch("")}><X size={12} className="text-gray-400" /></button>}
            </div>
            <button onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
              <UserPlus size={15} /> Invite
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex-1">

          {/* Table header */}
          <div className="grid bg-gray-50 border-b border-gray-200 px-5 py-3"
            style={{ gridTemplateColumns: "2fr 1fr 1fr 2fr 1.2fr" }}>
            {["Name", "Role", "Completion", "Email", "Tasks"].map(h => (
              <p key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</p>
            ))}
          </div>

          {/* Rows */}
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
                  <button onClick={() => toggleCollapse(dept)}
                    className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors"
                    style={{ background: dc.light }}>
                    {isCollapsed ? <ChevronRight size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    <span className="w-2 h-2 rounded-full" style={{ background: dc.dot }} />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700">{dept}</span>
                    <span className="text-xs text-gray-400 ml-1">{list.length}</span>
                  </button>

                  {/* Member rows */}
                  {!isCollapsed && list.map(m => {
                    const isSelected = selected?.id === m.id;
                    const completion = pct(m.completed || 0, m.tasks || 0);

                    return (
                      <div key={m.id}
                        onClick={() => setSelected(isSelected ? null : m)}
                        className="grid items-center px-5 py-3 cursor-pointer transition-colors hover:bg-indigo-50 border-l-2"
                        style={{
                          gridTemplateColumns: "2fr 1fr 1fr 2fr 1.2fr",
                          borderLeftColor: isSelected ? "#6366f1" : "transparent",
                          background: isSelected ? "#f0f4ff" : undefined,
                        }}>
                        {/* Name */}
                        <div className="flex items-center gap-3">
                          <Avatar name={m.name} size="sm" />
                          <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                        </div>

                        {/* Role */}
                        <div><RolePill role={m.role} /></div>

                        {/* Completion badge */}
                        <div><CompletionBadge completed={m.completed || 0} total={m.tasks || 0} /></div>

                        {/* Email */}
                        <p className="text-sm text-gray-500 truncate pr-4">{m.email}</p>

                        {/* Tasks progress */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-indigo-500 transition-all"
                              style={{ width: `${completion}%` }} />
                          </div>
                          <span className="text-xs text-gray-400 shrink-0 w-8 text-right">
                            {m.completed || 0}/{m.tasks || 0}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── RIGHT: DETAIL PANEL ── */}
      {selected && (
        <div className="w-[45%] pl-5 flex flex-col" style={{ animation: "slideIn 0.2s ease" }}>
          <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}`}</style>
          <MemberPanel
            member={selected}
            pending={pending}
            onClose={() => setSelected(null)}
            onCancelInvite={id => setPending(p => p.filter(x => x.id !== id))}
          />
        </div>
      )}

      {/* ── INVITE MODAL ── */}
      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite Team Member" size="md">
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address *</label>
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus-within:border-indigo-500 transition-colors">
              <Mail size={15} className="text-gray-400" />
              <input id="invite-email" name="email" type="email" required placeholder="colleague@company.com"
                value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <select id="invite-role" name="role" value={inviteForm.role} onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-indigo-500">
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
              <select id="invite-dept" name="department" value={inviteForm.department} onChange={e => setInviteForm({ ...inviteForm, department: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-indigo-500">
                <option value="">Select…</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowInvite(false)}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={inviting || !inviteForm.email}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium disabled:opacity-60 flex items-center gap-2 transition-colors">
              {inviting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {inviting ? "Sending…" : "Send Invite"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Member Detail Panel ──────────────────────────────────────────────────────

function MemberPanel({ member, pending, onClose, onCancelInvite }) {
  const [tab, setTab]  = useState("overview");
  const dc             = DEPT_COLORS[member.department] || { dot: "#6366f1", light: "#eef2ff" };
  const completion     = pct(member.completed || 0, member.tasks || 0);
  const remaining      = (member.tasks || 0) - (member.completed || 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-full"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-500">Member Profile</p>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Identity */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <Avatar name={member.name} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{member.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{member.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <RolePill role={member.role} />
              <span className="px-2 py-0.5 rounded text-xs font-semibold"
                style={{ background: dc.light, color: dc.dot }}>
                {member.department}
              </span>
              {/* Completion badge instead of status */}
              <CompletionBadge completed={member.completed || 0} total={member.tasks || 0} />
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
              tab === t.key ? "text-indigo-600 border-indigo-600" : "text-gray-500 border-transparent hover:text-gray-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-5">

        {tab === "overview" && (
          <div className="space-y-4">

            {/* Completion ring + stats */}
            <div className="flex items-center gap-5 p-4 bg-gray-50 rounded-xl">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="7" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke={dc.dot} strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - completion / 100)}`}
                    style={{ transition: "stroke-dashoffset 0.8s ease" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-bold text-gray-900 leading-none">{completion}%</p>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2">
                {[
                  { label: "Total",  value: member.tasks || 0,     color: "#374151" },
                  { label: "Done",   value: member.completed || 0, color: dc.dot    },
                  { label: "Left",   value: remaining,             color: "#f59e0b" },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-lg p-2.5 text-center border border-gray-100">
                    <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress bars */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Task Progress</p>
              {[
                { label: "Completed", val: member.completed || 0, total: member.tasks || 1, color: dc.dot    },
                { label: "Remaining", val: remaining,             total: member.tasks || 1, color: "#f59e0b" },
              ].map(({ label, val, total, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-600 font-medium">{label}</span>
                    <span className="font-semibold" style={{ color }}>{val} / {total}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct(val, total)}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Details */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Details</p>
              <div className="divide-y divide-gray-50">
                {[
                  { icon: Briefcase,   label: "Department", value: member.department || "—" },
                  { icon: TrendingUp,  label: "Role",       value: <RolePill role={member.role} /> },
                  { icon: CheckSquare, label: "Tasks",      value: `${member.completed || 0} of ${member.tasks || 0} completed` },
                  { icon: Clock,       label: "Joined",     value: member.joinedAt || "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-500">{label}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
                <button onClick={() => onCancelInvite(inv.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors shrink-0">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}