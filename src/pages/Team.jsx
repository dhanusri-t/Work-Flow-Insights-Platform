import { useState, useEffect } from "react";
import {
  UserPlus, Mail, X, Loader2, Crown, Shield, Users, Star,
  Clock, Search, ArrowUpRight, CheckCircle2,
  Briefcase, TrendingUp, Activity, Send
} from "lucide-react";
import Avatar from "../components/Avatar";
import Modal from "../components/Modal";
import { dashboardAPI } from "../api/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = [
  { value:"admin",   label:"Admin",   color:"#0f172a", bg:"#f1f5f9", icon:Crown  },
  { value:"manager", label:"Manager", color:"#1e3a5f", bg:"#dbeafe", icon:Shield },
  { value:"member",  label:"Member",  color:"#374151", bg:"#f3f4f6", icon:Users  },
  { value:"viewer",  label:"Viewer",  color:"#6b7280", bg:"#f9fafb", icon:Star   },
];

const DEPARTMENTS = ["Engineering","Design","Marketing","Product","Sales","Operations","HR"];

const DEPT_META = {
  Engineering: { color:"#1a1a2e", light:"#e8e8f0" },
  Design:      { color:"#2d1b69", light:"#ede8f9" },
  Marketing:   { color:"#7c2d12", light:"#fde8e0" },
  Product:     { color:"#064e3b", light:"#d1fae5" },
  Sales:       { color:"#7f1d1d", light:"#fee2e2" },
  Operations:  { color:"#1e3a5f", light:"#dbeafe" },
  HR:          { color:"#3b0764", light:"#ede9fe" },
};

const STATUS_META = {
  online:  { color:"#10b981", label:"Online"  },
  away:    { color:"#f59e0b", label:"Away"    },
  offline: { color:"#9ca3af", label:"Offline" },
};

const PENDING_DEFAULT = [
  { id:1, email:"newdev@acme.com",   role:"member", department:"Engineering", sentAt:"2 days ago" },
  { id:2, email:"designer@acme.com", role:"member", department:"Design",      sentAt:"5 days ago" },
];

const HEADLINES = ["Builds things that scale","Crafts pixel-perfect experiences","Grows the brand","Ships fast, breaks nothing","Closes deals","Keeps the wheels turning","Connects people and culture"];
const JOINED    = ["Jan 2024","Mar 2024","Jun 2023","Nov 2023","Feb 2024","Aug 2023","Oct 2023"];
const STATUSES  = ["online","online","online","away","offline","online","away"];

const pct = (done, total) => total > 0 ? Math.round((done/total)*100) : 0;

// ─── Small helpers ────────────────────────────────────────────────────────────

function RolePill({ role }) {
  const r = ROLES.find(x => x.value === role?.toLowerCase()) || ROLES[2];
  const Icon = r.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full"
      style={{ background:r.bg, color:r.color }}>
      <Icon size={10} strokeWidth={2.5}/>{r.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_META[status] || STATUS_META.offline;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color:s.color }}>
      <span className="w-2 h-2 rounded-full" style={{ background:s.color, boxShadow:`0 0 0 3px ${s.color}30` }}/>
      {s.label}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Team() {
  const [loading, setLoading]       = useState(true);
  const [members, setMembers]       = useState([]);
  const [selected, setSelected]     = useState(null);
  const [search, setSearch]         = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email:"", role:"member", department:"" });
  const [inviting, setInviting]     = useState(false);
  const [pending, setPending]       = useState(PENDING_DEFAULT);
  const [activeTab, setActiveTab]   = useState("overview");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getStats();
      const enriched = (res.data.teamMembers || []).map((m,i) => ({
        ...m,
        department: DEPARTMENTS[i % DEPARTMENTS.length],
        status:     STATUSES[i % STATUSES.length],
        joinedAt:   JOINED[i % JOINED.length],
        headline:   HEADLINES[i % HEADLINES.length],
      }));
      setMembers(enriched);
      if (enriched.length > 0) setSelected(enriched[0]);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const changeRole = (id, role) => {
    setMembers(p => p.map(m => m.id===id ? {...m,role} : m));
    setSelected(p => p?.id===id ? {...p,role} : p);
  };
  const changeDept = (id, dept) => {
    setMembers(p => p.map(m => m.id===id ? {...m,department:dept} : m));
    setSelected(p => p?.id===id ? {...p,department:dept} : p);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    await new Promise(r => setTimeout(r,900));
    setPending(p => [...p, { id:Date.now(), ...inviteForm, sentAt:"Just now" }]);
    setInviting(false);
    setShowInvite(false);
    setInviteForm({ email:"", role:"member", department:"" });
  };

  const filtered = members.filter(m => {
    if (search && !m.name?.toLowerCase().includes(search.toLowerCase()) &&
        !m.email?.toLowerCase().includes(search.toLowerCase())) return false;
    if (deptFilter !== "all" && m.department !== deptFilter) return false;
    return true;
  });

  const grouped = DEPARTMENTS.reduce((acc, dept) => {
    const list = filtered.filter(m => m.department === dept);
    if (list.length) acc[dept] = list;
    return acc;
  }, {});

  const onlineCount = members.filter(m=>m.status==="online").length;
  const avgRate     = members.length ? Math.round(members.reduce((s,m)=>s+pct(m.completed||0,m.tasks||0),0)/members.length) : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin text-gray-900"/>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        .tf-serif { font-family:'Playfair Display',Georgia,serif; }
        .tf-sans  { font-family:'DM Sans',sans-serif; }
        @keyframes slideRight { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }
        .slide-right { animation:slideRight 0.22s ease forwards; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .fade-up { animation:fadeUp 0.25s ease forwards; }
        .roster-row { transition: background 0.12s; cursor:pointer; }
        .roster-row:hover { background: rgba(15,23,42,0.04); }
        .roster-row.is-active { background:#0f172a !important; }
        .roster-row.is-active .r-name  { color:#fff !important; }
        .roster-row.is-active .r-email { color:rgba(255,255,255,0.45) !important; }
      `}</style>

      <div className="tf-sans flex flex-col" style={{ background:"#fafaf8", minHeight:"100vh" }}>

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400 mb-0.5">Flowcraft · People</p>
            <h1 className="tf-serif text-4xl font-black text-gray-950 leading-none">Team Directory</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              {[
                { label:`${members.length} members`, c:"#0f172a" },
                { label:`${onlineCount} online`,     c:"#10b981" },
                { label:`${avgRate}% avg`,           c:"#6366f1" },
              ].map(({label,c})=>(
                <span key={label} className="px-3 py-1.5 rounded-full text-xs font-bold border"
                  style={{ color:c, borderColor:c+"40", background:c+"0a" }}>
                  {label}
                </span>
              ))}
            </div>
            <button onClick={()=>setShowInvite(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all tf-sans"
              style={{ background:"#0f172a", boxShadow:"0 2px 10px rgba(15,23,42,0.2)" }}
              onMouseEnter={e=>e.currentTarget.style.background="#334155"}
              onMouseLeave={e=>e.currentTarget.style.background="#0f172a"}>
              <UserPlus size={15}/> Invite
            </button>
          </div>
        </div>

        {/* ── SPLIT PANE ── */}
        <div className="flex gap-5" style={{ height:"calc(100vh - 210px)", minHeight:"500px" }}>

          {/* ══ LEFT ROSTER ══ */}
          <div className="w-64 shrink-0 flex flex-col rounded-2xl overflow-hidden border border-gray-200 bg-white"
            style={{ boxShadow:"0 2px 16px rgba(0,0,0,0.06)" }}>

            {/* Search */}
            <div className="p-3 shrink-0" style={{ borderBottom:"1px solid #f1f5f9" }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
                <Search size={13} className="text-gray-400 shrink-0"/>
                <input type="text" placeholder="Search people…" value={search}
                  onChange={e=>setSearch(e.target.value)}
                  className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400 tf-sans"/>
                {search && <button onClick={()=>setSearch("")}><X size={11} className="text-gray-400"/></button>}
              </div>
            </div>

            {/* Dept filter chips */}
            <div className="px-3 pt-2 pb-2 shrink-0 flex flex-wrap gap-1" style={{ borderBottom:"1px solid #f1f5f9" }}>
              {["all",...DEPARTMENTS].map(d=>(
                <button key={d} onClick={()=>setDeptFilter(d)}
                  className="px-2 py-0.5 rounded-full text-xs font-bold transition-all tf-sans"
                  style={deptFilter===d
                    ? { background:"#0f172a", color:"#fff" }
                    : { background:"#f1f5f9", color:"#64748b" }}>
                  {d==="all"?"All":d.slice(0,3)}
                </button>
              ))}
            </div>

            {/* Grouped list */}
            <div className="flex-1 overflow-y-auto">
              {Object.keys(grouped).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-300">
                  <Users size={28} className="opacity-40"/>
                  <p className="text-xs">No results</p>
                </div>
              ) : Object.entries(grouped).map(([dept, list]) => {
                const meta = DEPT_META[dept] || { color:"#1a1a2e", light:"#f1f5f9" };
                return (
                  <div key={dept}>
                    {/* Dept header */}
                    <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-1.5"
                      style={{ background:meta.light, borderBottom:`1px solid ${meta.color}18` }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background:meta.color }}/>
                      <p className="text-xs font-black uppercase tracking-[0.12em]" style={{ color:meta.color }}>
                        {dept}
                      </p>
                      <span className="ml-auto text-xs font-bold" style={{ color:meta.color+"70" }}>{list.length}</span>
                    </div>

                    {/* Roster rows */}
                    {list.map(m => {
                      const isActive = selected?.id === m.id;
                      const sc = STATUS_META[m.status]?.color || "#9ca3af";
                      return (
                        <div key={m.id} onClick={()=>setSelected(m)}
                          className={`roster-row flex items-center gap-3 px-4 py-2.5 ${isActive?"is-active":""}`}>
                          <div className="relative shrink-0">
                            <Avatar name={m.name} size="sm"/>
                            <span className="absolute -bottom-px -right-px w-2.5 h-2.5 rounded-full border-2"
                              style={{ background:sc, borderColor: isActive?"#0f172a":"#fff" }}/>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="r-name text-xs font-bold text-gray-900 truncate leading-snug">{m.name}</p>
                            <p className="r-email text-xs text-gray-400 truncate">{m.email}</p>
                          </div>
                          {isActive && (
                            <span className="w-1 h-5 rounded-full shrink-0" style={{ background:"#6366f1" }}/>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 text-center shrink-0 bg-gray-50" style={{ borderTop:"1px solid #f1f5f9" }}>
              <p className="text-xs text-gray-400 font-semibold">{filtered.length} of {members.length} people</p>
            </div>
          </div>

          {/* ══ RIGHT DETAIL ══ */}
          <div className="flex-1 min-w-0 overflow-y-auto pr-0.5">
            {selected
              ? <DetailPane key={selected.id} member={selected}
                  onRoleChange={changeRole} onDeptChange={changeDept}
                  pending={pending} onCancelInvite={id=>setPending(p=>p.filter(x=>x.id!==id))}
                  activeTab={activeTab} setActiveTab={setActiveTab}/>
              : (
                <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3">
                  <Users size={48} className="opacity-30"/>
                  <p className="tf-serif text-2xl font-bold">Select a person</p>
                </div>
              )
            }
          </div>
        </div>
      </div>

      {/* ── INVITE MODAL ── */}
      <Modal isOpen={showInvite} onClose={()=>setShowInvite(false)} title="Invite to the Team" size="md">
        <form onSubmit={handleInvite} className="space-y-5 tf-sans">
          <div>
            <label className="block text-xs font-black uppercase tracking-[0.15em] text-gray-500 mb-2">Email *</label>
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus-within:border-gray-900 transition-all">
              <Mail size={15} className="text-gray-400 shrink-0"/>
              <input type="email" required placeholder="colleague@company.com"
                value={inviteForm.email} onChange={e=>setInviteForm({...inviteForm,email:e.target.value})}
                className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.15em] text-gray-500 mb-2">Role</label>
              <select value={inviteForm.role} onChange={e=>setInviteForm({...inviteForm,role:e.target.value})}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-gray-900">
                {ROLES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.15em] text-gray-500 mb-2">Department</label>
              <select value={inviteForm.department} onChange={e=>setInviteForm({...inviteForm,department:e.target.value})}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-gray-900">
                <option value="">Select…</option>
                {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-600">
            {inviteForm.role==="admin"   && "Full access — manage members, billing, and all settings."}
            {inviteForm.role==="manager" && "Can manage workflows, assign tasks, and view reports."}
            {inviteForm.role==="member"  && "Can create and complete tasks within assigned workflows."}
            {inviteForm.role==="viewer"  && "Read-only access — can view workflows and tasks."}
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={()=>setShowInvite(false)}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={inviting||!inviteForm.email}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-60"
              style={{ background:"#0f172a" }}
              onMouseEnter={e=>!inviting&&(e.currentTarget.style.background="#334155")}
              onMouseLeave={e=>e.currentTarget.style.background="#0f172a"}>
              {inviting?<Loader2 size={14} className="animate-spin"/>:<Send size={14}/>}
              {inviting?"Sending…":"Send Invite"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ─── Detail Pane ──────────────────────────────────────────────────────────────

function DetailPane({ member, onRoleChange, onDeptChange, pending, onCancelInvite, activeTab, setActiveTab }) {
  const completion = pct(member.completed||0, member.tasks||0);
  const dept       = DEPT_META[member.department] || { color:"#1a1a2e", light:"#f1f5f9" };
  const inProgress = (member.tasks||0) - (member.completed||0);

  return (
    <div className="slide-right tf-sans flex flex-col gap-4 h-full">

      {/* ── HERO BANNER ── */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shrink-0"
        style={{ boxShadow:"0 2px 16px rgba(0,0,0,0.07)" }}>

        {/* Colored band */}
        <div className="relative h-24"
          style={{ background:`linear-gradient(135deg,${dept.color} 0%,${dept.color}cc 100%)` }}>
          <div className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage:"repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)", backgroundSize:"10px 10px" }}/>
          {/* Avatar floats down */}
          <div className="absolute bottom-0 left-8 translate-y-1/2 z-10
            ring-4 ring-white rounded-full"
            style={{ boxShadow:`0 6px 20px ${dept.color}55` }}>
            <Avatar name={member.name} size="xl" status={member.status}/>
          </div>
        </div>

        {/* White section */}
        <div className="bg-white px-8 pt-12 pb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="tf-serif text-3xl font-black text-gray-950 leading-tight">{member.name}</h2>
              <p className="text-gray-400 text-sm mt-0.5">{member.email}</p>
              <p className="text-gray-400 text-sm italic mt-1">"{member.headline}"</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <RolePill role={member.role}/>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background:dept.light, color:dept.color }}>
                  {member.department}
                </span>
                <StatusBadge status={member.status}/>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={11}/> Joined {member.joinedAt}
                </span>
              </div>
            </div>
            {/* Edit controls */}
            <div className="flex gap-2 items-center">
              <div>
                <p className="text-xs text-gray-400 mb-1 font-semibold">Role</p>
                <select value={member.role?.toLowerCase()||"member"}
                  onChange={e=>onRoleChange(member.id,e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-gray-900">
                  {ROLES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1 font-semibold">Dept</p>
                <select value={member.department||""}
                  onChange={e=>onDeptChange(member.id,e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-gray-900">
                  {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200 shrink-0"
        style={{ boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
        {[
          { key:"overview", label:"Overview" },
          { key:"invites",  label:`Pending Invitations (${pending.length})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={()=>setActiveTab(key)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all tf-sans"
            style={activeTab===key
              ? { background:"#0f172a", color:"#fff", boxShadow:"0 2px 8px rgba(15,23,42,0.2)" }
              : { color:"#64748b" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab==="overview" && (
        <div className="fade-up grid grid-cols-12 gap-4">

          {/* Ring + numbers */}
          <div className="col-span-12 md:col-span-5 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center gap-4"
            style={{ boxShadow:"0 1px 8px rgba(0,0,0,0.05)" }}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 self-start">Performance</p>

            <div className="relative w-36 h-36">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="10"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke={dept.color} strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2*Math.PI*50}`}
                  strokeDashoffset={`${2*Math.PI*50*(1-completion/100)}`}
                  style={{ transition:"stroke-dashoffset 0.8s ease" }}/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="tf-serif text-3xl font-black text-gray-950">{completion}%</p>
                <p className="text-xs text-gray-400">completion</p>
              </div>
            </div>

            <div className="grid grid-cols-3 w-full gap-2 text-center">
              {[
                { label:"Total",      val:member.tasks||0,     color:"#0f172a"   },
                { label:"Completed",  val:member.completed||0, color:dept.color  },
                { label:"Remaining",  val:inProgress,          color:"#f59e0b"   },
              ].map(({label,val,color})=>(
                <div key={label} className="py-3 rounded-xl"
                  style={{ background:color+"0e", border:`1px solid ${color}1a` }}>
                  <p className="tf-serif text-2xl font-black" style={{color}}>{val}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Info + breakdown */}
          <div className="col-span-12 md:col-span-7 flex flex-col gap-4">

            {/* About rows */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5"
              style={{ boxShadow:"0 1px 8px rgba(0,0,0,0.05)" }}>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4">About</p>
              <div className="space-y-0 divide-y divide-gray-50">
                {[
                  { Icon:Briefcase,  label:"Department", val: member.department||"—"                          },
                  { Icon:Clock,      label:"Member Since",val: member.joinedAt                                 },
                  { Icon:Activity,   label:"Status",     val: <StatusBadge status={member.status}/>            },
                  { Icon:TrendingUp, label:"Role",        val: <RolePill role={member.role}/>                  },
                ].map(({ Icon, label, val }) => (
                  <div key={label} className="flex items-center gap-4 py-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background:dept.light }}>
                      <Icon size={14} style={{ color:dept.color }}/>
                    </div>
                    <p className="text-xs font-semibold text-gray-400 w-24 shrink-0">{label}</p>
                    <div className="text-sm font-semibold text-gray-800">{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Task breakdown bars */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5"
              style={{ boxShadow:"0 1px 8px rgba(0,0,0,0.05)" }}>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Task Breakdown</p>
              <div className="space-y-4">
                {[
                  { label:"Completed",   val:member.completed||0, total:member.tasks||1, color:dept.color },
                  { label:"In Progress", val:inProgress,          total:member.tasks||1, color:"#f59e0b"  },
                ].map(({label,val,total,color})=>(
                  <div key={label}>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-gray-600">{label}</span>
                      <span style={{color}}>{val} / {total}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width:`${pct(val,total)}%`, background:color }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── INVITES TAB ── */}
      {activeTab==="invites" && (
        <div className="fade-up bg-white rounded-2xl border border-gray-200 overflow-hidden"
          style={{ boxShadow:"0 1px 8px rgba(0,0,0,0.05)" }}>
          {pending.length===0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300 gap-2">
              <CheckCircle2 size={40} className="opacity-40"/>
              <p className="tf-serif text-xl font-bold">No pending invitations</p>
            </div>
          ) : (
            <>
              <div className="grid px-6 py-3 bg-gray-50"
                style={{ gridTemplateColumns:"1fr 100px 130px 90px 40px", borderBottom:"2px solid #0f172a" }}>
                {["Email","Role","Department","Sent",""].map(h=>(
                  <p key={h} className="text-xs font-black uppercase tracking-[0.15em] text-gray-400">{h}</p>
                ))}
              </div>
              {pending.map((inv,i)=>(
                <div key={inv.id}
                  className="grid items-center px-6 py-4 hover:bg-gray-50 transition-colors"
                  style={{ gridTemplateColumns:"1fr 100px 130px 90px 40px",
                    borderBottom:i<pending.length-1?"1px solid #f1f5f9":"none" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Mail size={13} className="text-gray-400"/>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 truncate">{inv.email}</p>
                  </div>
                  <RolePill role={inv.role}/>
                  <span className="text-xs font-semibold text-gray-500">{inv.department||"—"}</span>
                  <span className="text-xs text-gray-400">{inv.sentAt}</span>
                  <button onClick={()=>onCancelInvite(inv.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                    <X size={14}/>
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}