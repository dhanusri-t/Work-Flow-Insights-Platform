import { useState, useEffect, useMemo } from "react";
import {
  Search, Plus, Loader2, ChevronDown, ChevronRight,
  Flag, Calendar, Clock, User, MoreHorizontal,
  Pencil, Trash2, Save, X, Filter, AlertCircle,
  CheckCircle2, Circle, Timer, Eye, ArrowUpDown,
} from "lucide-react";
import Avatar from "../components/Avatar";
import Modal from "../components/Modal";
import { tasksAPI, workflowsAPI, teamAPI } from "../api/api";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  todo:        { label: "To Do",       color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af"  },
  in_progress: { label: "In Progress", color: "#2563eb", bg: "#dbeafe", dot: "#3b82f6"  },
  review:      { label: "In Review",   color: "#d97706", bg: "#fef3c7", dot: "#f59e0b"  },
  done:        { label: "Done",        color: "#059669", bg: "#d1fae5", dot: "#10b981"  },
};

const PRIORITY_CONFIG = {
  high:   { label: "High",   color: "#dc2626", bg: "#fee2e2" },
  medium: { label: "Medium", color: "#d97706", bg: "#fef3c7" },
  low:    { label: "Low",    color: "#059669", bg: "#d1fae5" },
};

// Phases — what the person doing the task sets to show their progress
const PHASES = [
  "Not started",
  "Planning",
  "In development",
  "Testing",
  "Waiting for review",
  "Blocked",
  "Completed",
];

const PHASE_CONFIG = {
  "Not started":      { color: "#6b7280", bg: "#f3f4f6" },
  "Planning":         { color: "#7c3aed", bg: "#ede9fe" },
  "In development":   { color: "#2563eb", bg: "#dbeafe" },
  "Testing":          { color: "#d97706", bg: "#fef3c7" },
  "Waiting for review":{ color: "#ea580c", bg: "#ffedd5" },
  "Blocked":          { color: "#dc2626", bg: "#fee2e2" },
  "Completed":        { color: "#059669", bg: "#d1fae5" },
};

const inputCls = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500";

// ─── Small helpers ────────────────────────────────────────────────────────────

function StatusPill({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.todo;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}

function PhasePill({ phase }) {
  if (!phase) return <span className="text-xs text-gray-400 italic">—</span>;
  const c = PHASE_CONFIG[phase] || { color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.color }}>
      {phase}
    </span>
  );
}

function PriorityDot({ priority }) {
  const c = PRIORITY_CONFIG[priority];
  if (!c) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: c.color }}>
      <Flag size={11} fill={c.color} />
      {c.label}
    </span>
  );
}

function DeadlineCell({ date }) {
  if (!date) return <span className="text-xs text-gray-400">—</span>;
  const d = new Date(date);
  const now = new Date();
  const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  const fmt = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const isOverdue = diff < 0;
  const isSoon = diff >= 0 && diff <= 3;
  return (
    <span className={`text-xs font-medium flex items-center gap-1 whitespace-nowrap ${
      isOverdue ? "text-red-600" : isSoon ? "text-amber-600" : "text-gray-600"
    }`}>
      {isOverdue && <AlertCircle size={11} />}
      {isSoon && !isOverdue && <Timer size={11} />}
      {fmt}
    </span>
  );
}

function RelativeTime({ date }) {
  if (!date) return <span className="text-xs text-gray-400">—</span>;
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  let label = days > 0 ? `${days}d ago` : hrs > 0 ? `${hrs}h ago` : mins > 0 ? `${mins}m ago` : "just now";
  return <span className="text-xs text-gray-500 whitespace-nowrap">{label}</span>;
}

// ─── Inline Phase Selector ────────────────────────────────────────────────────

function PhaseSelector({ task, onUpdate }) {
  const [open, setOpen] = useState(false);
  const c = task.phase ? (PHASE_CONFIG[task.phase] || { color: "#6b7280", bg: "#f3f4f6" }) : null;

  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:opacity-80"
        style={c ? { background: c.bg, color: c.color } : { background: "#f3f4f6", color: "#9ca3af" }}>
        {task.phase || <span className="italic">Set phase…</span>}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl border border-gray-200 shadow-lg py-1 min-w-40"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
          {PHASES.map(p => {
            const pc = PHASE_CONFIG[p];
            return (
              <button key={p}
                onClick={e => { e.stopPropagation(); onUpdate(task.id, { phase: p }); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 text-left">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: pc.color }} />
                <span style={{ color: pc.color, fontWeight: 600 }}>{p}</span>
              </button>
            );
          })}
          {task.phase && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button onClick={e => { e.stopPropagation(); onUpdate(task.id, { phase: null }); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:bg-gray-50">
                <X size={11} /> Clear phase
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Inline Status Selector ───────────────────────────────────────────────────

function StatusSelector({ task, onUpdate }) {
  const [open, setOpen] = useState(false);
  const c = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;

  return (
    <div className="relative">
      <button onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:opacity-80"
        style={{ background: c.bg, color: c.color }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
        {c.label}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl border border-gray-200 shadow-lg py-1 min-w-36"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
          {Object.entries(STATUS_CONFIG).map(([key, sc]) => (
            <button key={key}
              onClick={e => { e.stopPropagation(); onUpdate(task.id, { status: key }); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 text-left">
              <span className="w-2 h-2 rounded-full" style={{ background: sc.dot }} />
              <span style={{ color: sc.color, fontWeight: 600 }}>{sc.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Row Actions Menu ─────────────────────────────────────────────────────────

function RowMenu({ task, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all">
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl border border-gray-200 shadow-lg py-1 w-36"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
          <button onClick={e => { e.stopPropagation(); onEdit(task); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
            <Pencil size={12} /> Edit task
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(task); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50">
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Workflow Group ───────────────────────────────────────────────────────────

function WorkflowGroup({ workflow, tasks, teamMembers, onUpdate, onEdit, onDelete }) {
  const [collapsed, setCollapsed] = useState(false);

  const done  = tasks.filter(t => t.status === "done").length;
  const total = tasks.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  const wfStatus = workflow.status || "active";
  const statusC = {
    active:    { color: "#059669", bg: "#d1fae5" },
    completed: { color: "#2563eb", bg: "#dbeafe" },
    on_hold:   { color: "#d97706", bg: "#fef3c7" },
    draft:     { color: "#6b7280", bg: "#f3f4f6" },
  }[wfStatus] || { color: "#6b7280", bg: "#f3f4f6" };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
      style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>

      {/* Group header */}
      <button onClick={() => setCollapsed(p => !p)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {collapsed ? <ChevronRight size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
          <h3 className="font-semibold text-gray-900 text-sm truncate">{workflow.name}</h3>
          <span className="px-2 py-0.5 rounded text-xs font-semibold shrink-0"
            style={{ background: statusC.bg, color: statusC.color }}>
            {wfStatus.replace("_", " ")}
          </span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-500 font-medium w-10">{done}/{total}</span>
          </div>
          <span className="text-xs font-bold text-indigo-600 w-8 text-right">{pct}%</span>
        </div>
      </button>

      {/* Table */}
      {!collapsed && (
        <>
          {/* Column headers */}
          <div className="grid items-center px-5 py-2 bg-gray-50 border-t border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider"
            style={{ gridTemplateColumns: "2.5fr 1fr 1.2fr 1.2fr 1fr 1.2fr 0.8fr 36px" }}>
            <span>Task</span>
            <span>Assignee</span>
            <span>Status</span>
            <span>Phase</span>
            <span>Priority</span>
            <span>Last Updated</span>
            <span>Deadline</span>
            <span />
          </div>

          {/* Task rows */}
          <div className="divide-y divide-gray-50">
            {tasks.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No tasks in this workflow</div>
            ) : tasks.map(task => (
              <div key={task.id}
                className="group grid items-center px-5 py-3 hover:bg-indigo-50/40 transition-colors"
                style={{ gridTemplateColumns: "2.5fr 1fr 1.2fr 1.2fr 1fr 1.2fr 0.8fr 36px" }}>

                {/* Title */}
                <div className="min-w-0 pr-3">
                  <p className="text-sm font-medium text-gray-900 truncate leading-snug">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{task.description}</p>
                  )}
                </div>

                {/* Assignee */}
                <div>
                  {task.assignee ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar name={task.assignee.name} size="sm" />
                      <span className="text-xs text-gray-600 truncate max-w-20">{task.assignee.name.split(" ")[0]}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <User size={12} /> Unassigned
                    </span>
                  )}
                </div>

                {/* Status — inline editable */}
                <div onClick={e => e.stopPropagation()}>
                  <StatusSelector task={task} onUpdate={onUpdate} />
                </div>

                {/* Phase — inline editable */}
                <div onClick={e => e.stopPropagation()}>
                  <PhaseSelector task={task} onUpdate={onUpdate} />
                </div>

                {/* Priority */}
                <div><PriorityDot priority={task.priority} /></div>

                {/* Last updated */}
                <div><RelativeTime date={task.last_updated_by_user || task.updated_at} /></div>

                {/* Deadline */}
                <div><DeadlineCell date={task.due_date} /></div>

                {/* Row actions */}
                <div onClick={e => e.stopPropagation()}>
                  <RowMenu task={task} onEdit={onEdit} onDelete={onDelete} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Tasks() {
  const [loading, setLoading]           = useState(true);
  const [tasks, setTasks]               = useState([]);
  const [workflows, setWorkflows]       = useState([]);
  const [teamMembers, setTeamMembers]   = useState([]);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Modals
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToEdit, setTaskToEdit]           = useState(null);
  const [taskToDelete, setTaskToDelete]       = useState(null);

  const [creating, setCreating] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [newTask, setNewTask]   = useState({ workflow_id: "", title: "", description: "", priority: "medium", assigned_to: "", due_date: "", phase: "" });
  const [editTask, setEditTask] = useState({ title: "", description: "", priority: "medium", assigned_to: "", status: "todo", due_date: "", phase: "" });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [tasksRes, workflowsRes, teamRes] = await Promise.all([
        tasksAPI.getAll(),
        workflowsAPI.getAll(),
        teamAPI.getAll(),
      ]);
      setTasks(tasksRes.data);
      setWorkflows(workflowsRes.data);
      setTeamMembers(teamRes.data);
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  // Inline update (status or phase from dropdowns in table)
  const handleInlineUpdate = async (taskId, updates) => {
    // Optimistic
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t));
    try {
      await tasksAPI.update(taskId, updates);
    } catch (err) {
      console.error("Inline update failed:", err);
      fetchAll(); // revert
    }
  };

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      await tasksAPI.create({
        ...newTask,
        assigned_to: newTask.assigned_to || null,
        due_date: newTask.due_date || null,
        phase: newTask.phase || null,
        workflow_id: parseInt(newTask.workflow_id),
      });
      setShowAddModal(false);
      setNewTask({ workflow_id: "", title: "", description: "", priority: "medium", assigned_to: "", due_date: "", phase: "" });
      fetchAll();
    } catch (err) {
      console.error("Create failed:", err);
      alert(err.response?.data?.message || "Failed to create task.");
    } finally {
      setCreating(false);
    }
  };

  // Open edit
  const openEdit = (task) => {
    setTaskToEdit(task);
    setEditTask({
      title:       task.title       || "",
      description: task.description || "",
      priority:    task.priority    || "medium",
      assigned_to: task.assigned_to || "",
      status:      task.status      || "todo",
      due_date:    task.due_date ? task.due_date.split("T")[0] : "",
      phase:       task.phase       || "",
    });
    setShowEditModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await tasksAPI.update(taskToEdit.id, {
        ...editTask,
        assigned_to: editTask.assigned_to || null,
        due_date: editTask.due_date || null,
        phase: editTask.phase || null,
      });
      setShowEditModal(false);
      setTaskToEdit(null);
      fetchAll();
    } catch (err) {
      console.error("Save failed:", err);
      alert(err.response?.data?.message || "Failed to save task.");
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const openDelete = (task) => { setTaskToDelete(task); setShowDeleteModal(true); };
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await tasksAPI.delete(taskToDelete.id);
      setShowDeleteModal(false);
      setTaskToDelete(null);
      fetchAll();
    } catch (err) {
      console.error("Delete failed:", err);
      alert(err.response?.data?.message || "Failed to delete task.");
    } finally {
      setDeleting(false);
    }
  };

  // Filter + group by workflow
  const filtered = useMemo(() => tasks.filter(t => {
    if (search && !t.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  }), [tasks, search, statusFilter, priorityFilter]);

  const grouped = useMemo(() => {
    const map = new Map();
    workflows.forEach(w => map.set(w.id, { workflow: w, tasks: [] }));
    filtered.forEach(t => {
      if (map.has(t.workflow_id)) map.get(t.workflow_id).tasks.push(t);
      else {
        // workflow not in list — create a placeholder
        map.set(t.workflow_id, { workflow: { id: t.workflow_id, name: t.workflow_name || `Workflow #${t.workflow_id}`, status: "active" }, tasks: [t] });
      }
    });
    // Remove workflows with no tasks when filtering
    return Array.from(map.values()).filter(g => g.tasks.length > 0 || !search && statusFilter === "all" && priorityFilter === "all");
  }, [filtered, workflows, search, statusFilter, priorityFilter]);

  // Summary counts
  const counts = useMemo(() => ({
    total:       tasks.length,
    todo:        tasks.filter(t => t.status === "todo").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    review:      tasks.filter(t => t.status === "review").length,
    done:        tasks.filter(t => t.status === "done").length,
    overdue:     tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length,
  }), [tasks]);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Tracker</h1>
          <p className="text-sm text-gray-500 mt-0.5">All tasks grouped by workflow — update status & phase inline</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/25">
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* ── Summary pills ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: "Total",       value: counts.total,       color: "#6366f1", bg: "#eef2ff"  },
          { label: "To Do",       value: counts.todo,        color: "#6b7280", bg: "#f3f4f6"  },
          { label: "In Progress", value: counts.in_progress, color: "#2563eb", bg: "#dbeafe"  },
          { label: "In Review",   value: counts.review,      color: "#d97706", bg: "#fef3c7"  },
          { label: "Done",        value: counts.done,        color: "#059669", bg: "#d1fae5"  },
          { label: "Overdue",     value: counts.overdue,     color: "#dc2626", bg: "#fee2e2"  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl flex-1 max-w-80">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input type="text" placeholder="Search tasks..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-sm outline-none text-gray-700 placeholder-gray-400 flex-1 bg-transparent" />
          {search && <button onClick={() => setSearch("")}><X size={12} className="text-gray-400" /></button>}
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-500">
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-500">
            <option value="all">All Priorities</option>
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {(search || statusFilter !== "all" || priorityFilter !== "all") && (
          <button onClick={() => { setSearch(""); setStatusFilter("all"); setPriorityFilter("all"); }}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* ── Workflow groups ── */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 gap-3">
          <CheckCircle2 size={40} className="text-gray-200" />
          <p className="text-sm text-gray-400">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ workflow, tasks: wfTasks }) => (
            <WorkflowGroup
              key={workflow.id}
              workflow={workflow}
              tasks={wfTasks}
              teamMembers={teamMembers}
              onUpdate={handleInlineUpdate}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          ))}
        </div>
      )}

      {/* ── Add Task Modal ── */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Task" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Workflow *</label>
            <select id="add-workflow" name="workflow_id" value={newTask.workflow_id}
              onChange={e => setNewTask({ ...newTask, workflow_id: e.target.value })} required className={inputCls}>
              <option value="">Select workflow</option>
              {workflows.map(w => <option key={w.id} value={w.id}>{w.name || w.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Task Title *</label>
            <input id="add-title" name="title" type="text" required
              value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Enter task title" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select id="add-priority" name="priority" value={newTask.priority}
                onChange={e => setNewTask({ ...newTask, priority: e.target.value })} className={inputCls}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignee</label>
              <select id="add-assignee" name="assigned_to" value={newTask.assigned_to}
                onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })} className={inputCls}>
                <option value="">Unassigned</option>
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phase</label>
              <select id="add-phase" name="phase" value={newTask.phase}
                onChange={e => setNewTask({ ...newTask, phase: e.target.value })} className={inputCls}>
                <option value="">No phase</option>
                {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
              <input id="add-due" name="due_date" type="date"
                value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea id="add-desc" name="description" rows={2}
              value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Optional description…" className={`${inputCls} resize-none`} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={() => setShowAddModal(false)}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={creating || !newTask.workflow_id || !newTask.title}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium disabled:opacity-60 flex items-center gap-2">
              {creating && <Loader2 size={14} className="animate-spin" />} Add Task
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Task Modal ── */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Task" size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Task Title *</label>
            <input id="edit-title" name="title" type="text" required
              value={editTask.title} onChange={e => setEditTask({ ...editTask, title: e.target.value })}
              className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select id="edit-status" name="status" value={editTask.status}
                onChange={e => setEditTask({ ...editTask, status: e.target.value })} className={inputCls}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select id="edit-priority" name="priority" value={editTask.priority}
                onChange={e => setEditTask({ ...editTask, priority: e.target.value })} className={inputCls}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phase</label>
              <select id="edit-phase" name="phase" value={editTask.phase}
                onChange={e => setEditTask({ ...editTask, phase: e.target.value })} className={inputCls}>
                <option value="">No phase</option>
                {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignee</label>
              <select id="edit-assignee" name="assigned_to" value={editTask.assigned_to}
                onChange={e => setEditTask({ ...editTask, assigned_to: e.target.value })} className={inputCls}>
                <option value="">Unassigned</option>
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
            <input id="edit-due" name="due_date" type="date"
              value={editTask.due_date} onChange={e => setEditTask({ ...editTask, due_date: e.target.value })}
              className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea id="edit-desc" name="description" rows={2}
              value={editTask.description} onChange={e => setEditTask({ ...editTask, description: e.target.value })}
              className={`${inputCls} resize-none`} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={() => setShowEditModal(false)}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium disabled:opacity-60 flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}<Save size={14} /> Save
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm ── */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Task" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">Are you sure you want to delete <strong>{taskToDelete?.title}</strong>? This cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowDeleteModal(false)}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleDelete} disabled={deleting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium disabled:opacity-60 flex items-center gap-2">
              {deleting && <Loader2 size={14} className="animate-spin" />}<Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}