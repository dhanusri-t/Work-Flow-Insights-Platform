import { useState, useEffect } from "react";
import {
  TrendingUp, CheckCircle2, Clock, Users, Layers,
  ListTodo, BarChart2, Activity, ArrowUpRight,
  Loader2, AlertCircle, Circle,
} from "lucide-react";
import Avatar from "../components/Avatar";
import { dashboardAPI, workflowsAPI, teamAPI } from "../api/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pct = (n, total) => total > 0 ? Math.round((n / total) * 100) : 0;

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days  > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins  > 0) return `${mins}m ago`;
  return "Just now";
}

const STATUS_CONFIG = {
  todo:        { label: "To do",      color: "#6b7280", bar: "#e5e7eb" },
  in_progress: { label: "In progress", color: "#2563eb", bar: "#dbeafe" },
  review:      { label: "In review",  color: "#d97706", bar: "#fef3c7" },
  done:        { label: "Done",       color: "#059669", bar: "#d1fae5" },
};

const WORKFLOW_STATUS = {
  active:    { label: "Active",    color: "#2563eb", bg: "#dbeafe" },
  completed: { label: "Completed", color: "#059669", bg: "#d1fae5" },
  on_hold:   { label: "On hold",   color: "#d97706", bg: "#fef3c7" },
  draft:     { label: "Draft",     color: "#6b7280", bg: "#f3f4f6" },
};

// ─── Subcomponents ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = "#6366f1", bg = "#eef2ff", trend }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5"
      style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          <Icon size={18} style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
            <ArrowUpRight size={13} /> {trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{value ?? "—"}</p>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 ${className}`}
      style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
      {children}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Analytics() {
  const [stats,     setStats]     = useState(null);
  const [activity,  setActivity]  = useState([]);
  const [team,      setTeam]      = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [dashRes, wfRes, teamRes] = await Promise.all([
        dashboardAPI.getStats(),
        workflowsAPI.getAll(),
        teamAPI.getAll(),
      ]);
      setStats(dashRes.data.stats);
      setActivity(dashRes.data.recentActivity || []);
      setWorkflows(wfRes.data || []);
      setTeam(teamRes.data || []);
    } catch (e) {
      console.error(e);
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-96 gap-2 text-red-500">
      <AlertCircle size={18} /> <p className="text-sm">{error}</p>
    </div>
  );

  const total    = stats?.totalTasks || 0;
  const done     = stats?.doneTasks  || 0;
  const inProg   = stats?.inProgressTasks || 0;
  const review   = stats?.reviewTasks || 0;
  const todo     = stats?.todoTasks   || 0;

  // Task breakdown bars
  const taskBreakdown = [
    { key: "done",        value: done,   ...STATUS_CONFIG.done        },
    { key: "in_progress", value: inProg, ...STATUS_CONFIG.in_progress },
    { key: "review",      value: review, ...STATUS_CONFIG.review      },
    { key: "todo",        value: todo,   ...STATUS_CONFIG.todo        },
  ];

  // Top performers — sort by completion rate
  const topPerformers = [...team]
    .map(m => ({
      ...m,
      totalTasks:     m.tasks?.total     ?? m.tasks     ?? 0,
      completedTasks: m.tasks?.completed ?? m.completed ?? 0,
    }))
    .filter(m => m.totalTasks > 0)
    .sort((a, b) => (b.completedTasks / b.totalTasks) - (a.completedTasks / a.totalTasks))
    .slice(0, 5);

  return (
    <div className="space-y-7 pb-8">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">Workspace performance overview</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <Activity size={14} /> Refresh
        </button>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Layers}
          label="Total workflows"
          value={stats?.totalWorkflows}
          sub={`${stats?.activeWorkflows} active · ${stats?.completedWorkflows} done`}
          color="#6366f1" bg="#eef2ff"
        />
        <StatCard
          icon={CheckCircle2}
          label="Tasks completed"
          value={done}
          sub={`of ${total} total tasks`}
          color="#059669" bg="#d1fae5"
        />
        <StatCard
          icon={TrendingUp}
          label="Team efficiency"
          value={`${stats?.teamEfficiency ?? 0}%`}
          sub="Tasks completed on time"
          color="#2563eb" bg="#dbeafe"
        />
        <StatCard
          icon={Clock}
          label="Avg completion"
          value={stats?.avgCompletionTime || "—"}
          sub="Per task, when done"
          color="#d97706" bg="#fef3c7"
        />
      </div>

      {/* ── Middle row: Task breakdown + Workflow status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Task breakdown */}
        <Card className="p-6">
          <SectionHeader title="Task breakdown" sub="Current status of all tasks" />

          {/* Big donut-style summary */}
          <div className="flex items-center gap-5 mb-6">
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="30" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                {/* Done arc */}
                <circle cx="40" cy="40" r="30" fill="none" stroke="#059669" strokeWidth="10"
                  strokeLinecap="butt"
                  strokeDasharray={`${2 * Math.PI * 30 * pct(done, total) / 100} ${2 * Math.PI * 30}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-lg font-bold text-gray-900 leading-none">{pct(done, total)}%</p>
                <p className="text-xs text-gray-400">done</p>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              {taskBreakdown.map(({ key, label, value, color, bar }) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-600">{label}</span>
                    <span className="font-bold" style={{ color }}>{value}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: bar }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct(value, total)}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pill summary row */}
          <div className="grid grid-cols-4 gap-2">
            {taskBreakdown.map(({ key, label, value, color, bar }) => (
              <div key={key} className="rounded-xl p-3 text-center" style={{ background: bar }}>
                <p className="text-lg font-bold" style={{ color }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color }}>{label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Workflow status */}
        <Card className="p-6">
          <SectionHeader title="Workflows" sub={`${workflows.length} total workflows`} />
          <div className="space-y-2.5">
            {workflows.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No workflows yet</p>
            ) : workflows.slice(0, 6).map(wf => {
              const sc = WORKFLOW_STATUS[wf.status] || WORKFLOW_STATUS.draft;
              return (
                <div key={wf.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{wf.title || wf.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{wf.category || "General"}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold shrink-0"
                    style={{ background: sc.bg, color: sc.color }}>
                    {sc.label}
                  </span>
                </div>
              );
            })}
            {workflows.length > 6 && (
              <p className="text-xs text-gray-400 pt-1">+{workflows.length - 6} more workflows</p>
            )}
          </div>
        </Card>
      </div>

      {/* ── Bottom row: Top performers + Activity feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top performers */}
        <Card className="p-6">
          <SectionHeader title="Top performers" sub="Ranked by task completion rate" />
          {topPerformers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Users size={32} className="text-gray-200" />
              <p className="text-sm text-gray-400">No data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topPerformers.map((m, i) => {
                const rate = pct(m.completedTasks, m.totalTasks);
                const medals = ["🥇","🥈","🥉"];
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <span className="text-base w-5 text-center shrink-0">
                      {i < 3 ? medals[i] : <span className="text-xs text-gray-300 font-bold">{i+1}</span>}
                    </span>
                    <Avatar name={m.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                        <span className="text-xs font-bold text-gray-700 shrink-0 ml-2">{rate}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${rate}%`,
                            background: i === 0 ? "#f59e0b" : i === 1 ? "#9ca3af" : i === 2 ? "#b45309" : "#6366f1"
                          }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{m.completedTasks}/{m.totalTasks} tasks</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Activity feed */}
        <Card className="p-6">
          <SectionHeader title="Recent activity" sub="Latest task updates across workflows" />
          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Activity size={32} className="text-gray-200" />
              <p className="text-sm text-gray-400">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-gray-50">
              {activity.slice(0, 8).map(a => {
                const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.todo;
                return (
                  <div key={a.id} className="flex items-start gap-3 py-3">
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ background: sc.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {a.workflow_name}
                        {a.updated_by ? ` · ${a.updated_by}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                        style={{ background: sc.bar, color: sc.color }}>
                        {sc.label}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(a.updated_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Team overview table ── */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Team overview</h2>
          <p className="text-xs text-gray-400 mt-0.5">{team.length} members · task distribution</p>
        </div>
        <div className="divide-y divide-gray-50">
          {/* Header */}
          <div className="grid px-6 py-2.5 bg-gray-50"
            style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr" }}>
            {["Member", "Role", "Assigned", "Done", "Progress"].map(h => (
              <p key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</p>
            ))}
          </div>
          {team.slice(0, 8).map(m => {
            const tot  = m.tasks?.total     ?? m.tasks     ?? 0;
            const comp = m.tasks?.completed ?? m.completed ?? 0;
            const rate = pct(comp, tot);
            return (
              <div key={m.id} className="grid items-center px-6 py-3"
                style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={m.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                    <p className="text-xs text-gray-400 truncate">{m.email}</p>
                  </div>
                </div>
                <p className="text-xs font-semibold capitalize" style={{
                  color: m.role === "admin" ? "#7c3aed" : m.role === "manager" ? "#1d4ed8" : "#047857"
                }}>{m.role}</p>
                <p className="text-sm font-semibold text-gray-700">{tot}</p>
                <p className="text-sm font-semibold text-emerald-600">{comp}</p>
                <div className="flex items-center gap-2 pr-4">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${rate}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right shrink-0">{rate}%</span>
                </div>
              </div>
            );
          })}
          {team.length === 0 && (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-gray-400">No team members yet</p>
            </div>
          )}
        </div>
      </Card>

    </div>
  );
}