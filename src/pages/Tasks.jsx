import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search, Plus, Loader2, ChevronDown, ChevronRight,
  Flag, AlertCircle, Timer, User, MoreHorizontal,
  Pencil, Trash2, Save, X, Filter, CheckCircle2,
} from "lucide-react";
import { tasksAPI, workflowsAPI, teamAPI } from "../api/api";
import { useToast } from "../context/ToastContext";

// ─── Config ────────────────────────────────────────────────────────────────────

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

// Phases — set by the person doing the task to show their progress
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
  "Not started":       { color: "#6b7280", bg: "#f3f4f6" },
  "Planning":          { color: "#7c3aed", bg: "#ede9fe" },
  "In development":    { color: "#2563eb", bg: "#dbeafe" },
  "Testing":           { color: "#d97706", bg: "#fef3c7" },
  "Waiting for review":{ color: "#ea580c", bg: "#ffedd5" },
  "Blocked":           { color: "#dc2626", bg: "#fee2e2" },
  "Completed":         { color: "#059669", bg: "#d1fae5" },
};

const inputCls =
  "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 " +
  "placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function PriorityDot({ priority }) {
  const c = PRIORITY_CONFIG[priority];
  if (!c) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap" style={{ color: c.color }}>
      <Flag size={11} fill={c.color} /> {c.label}
    </span>
  );
}

function DeadlineCell({ date }) {
  if (!date) return <span className="text-xs text-gray-400">—</span>;
  const d    = new Date(date);
  const diff = Math.ceil((d - Date.now()) / 86400000);
  const fmt  = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const isOverdue = diff < 0;
  const isSoon    = diff >= 0 && diff <= 3;
  return (
    <span className={`text-xs font-medium flex items-center gap-1 whitespace-nowrap
      ${isOverdue ? "text-red-600" : isSoon ? "text-amber-600" : "text-gray-600"}`}>
      {isOverdue && <AlertCircle size={11} />}
      {isSoon && !isOverdue && <Timer size={11} />}
      {fmt}
    </span>
  );
}

function RelativeTime({ date }) {
  if (!date) return <span className="text-xs text-gray-400">—</span>;
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const label = days > 0 ? `${days}d ago` : hrs > 0 ? `${hrs}h ago` : mins > 0 ? `${mins}m ago` : "just now";
  return <span className="text-xs text-gray-500 whitespace-nowrap">{label}</span>;
}

function Avatar({ name }) {
  if (!name) return null;
  const initials = name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  const colors   = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
  const bg       = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ background: bg, fontSize: 9 }}>
      {initials}
    </div>
  );
}

// ─── Inline Phase Selector ──────────────────────────────────────────────────────
// Uses fixed positioning via getBoundingClientRect to escape any overflow clipping

function PhaseSelector({ task, onUpdate, canEdit }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const c = task.phase ? (PHASE_CONFIG[task.phase] || { color: "#6b7280", bg: "#f3f4f6" }) : null;

  const pill = (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={c ? { background: c.bg, color: c.color } : { background: "#f3f4f6", color: "#9ca3af" }}>
      {task.phase || <span className="italic">—</span>}
    </span>
  );

  if (!canEdit) return pill;

  const handleOpen = (e) => {
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen(p => !p);
  };

  return (
    <div>
      <button ref={btnRef}
        onClick={handleOpen}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:opacity-75 cursor-pointer"
        style={c ? { background: c.bg, color: c.color } : { background: "#f3f4f6", color: "#9ca3af" }}>
        {task.phase || <span className="italic">Set phase…</span>}
        <ChevronDown size={10} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div className="fixed z-[9999] bg-white rounded-xl border border-gray-200 py-1 w-52 overflow-y-auto"
            style={{ top: pos.top, left: pos.left, maxHeight: 280, boxShadow: "0 8px 32px rgba(0,0,0,0.16)" }}>
            {PHASES.map(p => {
              const pc = PHASE_CONFIG[p];
              return (
                <button key={p}
                  onClick={e => { e.stopPropagation(); onUpdate(task.id, { phase: p }); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-gray-50 text-left">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: pc.color }} />
                  <span style={{ color: pc.color, fontWeight: 600 }}>{p}</span>
                  {task.phase === p && <span className="ml-auto text-indigo-500 text-xs">✓</span>}
                </button>
              );
            })}
            {task.phase && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button onClick={e => { e.stopPropagation(); onUpdate(task.id, { phase: null }); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-400 hover:bg-gray-50">
                  <X size={11} /> Clear phase
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Inline Status Selector ─────────────────────────────────────────────────────

function StatusSelector({ task, onUpdate, canEdit }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const c = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;

  const pill = (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  );

  if (!canEdit) return pill;

  const handleOpen = (e) => {
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen(p => !p);
  };

  return (
    <div>
      <button ref={btnRef} onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:opacity-75 cursor-pointer"
        style={{ background: c.bg, color: c.color }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
        {c.label}
        <ChevronDown size={10} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div className="fixed z-[9999] bg-white rounded-xl border border-gray-200 py-1 w-40"
            style={{ top: pos.top, left: pos.left, boxShadow: "0 8px 32px rgba(0,0,0,0.16)" }}>
            {Object.entries(STATUS_CONFIG).map(([key, sc]) => (
              <button key={key}
                onClick={e => { e.stopPropagation(); onUpdate(task.id, { status: key }); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-gray-50 text-left">
                <span className="w-2 h-2 rounded-full" style={{ background: sc.dot }} />
                <span style={{ color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                {task.status === key && <span className="ml-auto text-indigo-500">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Row Actions Menu ───────────────────────────────────────────────────────────

function RowMenu({ task, onEdit, onDelete, canEdit, canDelete }) {
  const [open, setOpen] = useState(false);
  if (!canEdit && !canDelete) return null;
  return (
    <div className="relative">
      <button onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all">
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl border border-gray-200 py-1 w-36"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.13)" }}>
            {canEdit && (
              <button onClick={e => { e.stopPropagation(); onEdit(task); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
                <Pencil size={12} /> Edit task
              </button>
            )}
            {canDelete && (
              <button onClick={e => { e.stopPropagation(); onDelete(task); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50">
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Simple Modal ───────────────────────────────────────────────────────────────

function Modal({ isOpen, onClose, title, children, size = "md" }) {
  if (!isOpen) return null;
  const maxW = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-lg";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxW} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Workflow Group ─────────────────────────────────────────────────────────────

function WorkflowGroup({ workflow, tasks, onUpdate, onEdit, onDelete, currentUser }) {
  const [collapsed, setCollapsed] = useState(false);

  const done  = tasks.filter(t => t.status === "done").length;
  const total = tasks.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  // API returns workflows with `title` (mapped from DB `name` column in workflow.routes.js)
  // Fallback to .name for placeholder groups built from task data
  const wfName   = workflow.title || workflow.name || `Workflow #${workflow.id}`;
  const wfStatus = workflow.status || "active";

  const statusC = {
    active:    { color: "#059669", bg: "#d1fae5" },
    completed: { color: "#2563eb", bg: "#dbeafe" },
    on_hold:   { color: "#d97706", bg: "#fef3c7" },
    draft:     { color: "#6b7280", bg: "#f3f4f6" },
  }[wfStatus] || { color: "#6b7280", bg: "#f3f4f6" };

  const role = currentUser?.role;

  return (
    <div className="bg-white rounded-2xl border border-gray-200"
      style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)", borderRadius: "1rem" }}>

      {/* Collapsible header */}
      <button onClick={() => setCollapsed(p => !p)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {collapsed
            ? <ChevronRight size={16} className="text-gray-400 shrink-0" />
            : <ChevronDown  size={16} className="text-gray-400 shrink-0" />}
          {/* Colour block matching workflow status */}
          <span className="w-2.5 h-2.5 rounded-sm shrink-0 opacity-70" style={{ background: statusC.color }} />
          <h3 className="font-semibold text-gray-900 text-sm truncate">{wfName}</h3>
          <span className="px-2 py-0.5 rounded text-xs font-semibold shrink-0 capitalize"
            style={{ background: statusC.bg, color: statusC.color }}>
            {wfStatus.replace("_", " ")}
          </span>
          <span className="text-xs text-gray-400 shrink-0">{total} task{total !== 1 ? "s" : ""}</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-gray-500 font-medium w-14 text-right">{done}/{total} done</span>
          <span className="text-xs font-bold text-indigo-600 w-8 text-right">{pct}%</span>
        </div>
      </button>

      {!collapsed && (
        <>
          {/* Column headers */}
          <div className="grid items-center px-5 py-2 bg-gray-50 border-t border-gray-100
            text-xs font-semibold text-gray-500 uppercase tracking-wider"
            style={{ gridTemplateColumns: "2.4fr 1fr 1.2fr 1.4fr 0.8fr 1.1fr 0.9fr 32px" }}>
            <span>Task</span>
            <span>Assignee</span>
            <span>Status</span>
            <span>Phase</span>
            <span>Priority</span>
            <span>Last updated</span>
            <span>Deadline</span>
            <span />
          </div>

          <div className="divide-y divide-gray-50">
            {tasks.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No tasks in this workflow</div>
            ) : tasks.map(task => {
              // Determine what this user can do
              const isOwner   = currentUser && parseInt(task.assigned_to) === parseInt(currentUser.id);
              // Only the assigned person can update status/phase inline
              // Admins/managers use the Edit modal for full control
              const canInline = isOwner;
              const canEdit   = role === "admin" || role === "manager";
              const canDelete = role === "admin";

              return (
                <div key={task.id}
                  className="group grid items-center px-5 py-3 hover:bg-indigo-50/40 transition-colors"
                  style={{ gridTemplateColumns: "2.4fr 1fr 1.2fr 1.4fr 0.8fr 1.1fr 0.9fr 32px" }}>

                  {/* Title + description */}
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{task.description}</p>
                    )}
                  </div>

                  {/* Assignee */}
                  <div>
                    {task.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar name={task.assignee.name} />
                        <span className="text-xs text-gray-600 truncate max-w-[70px]">
                          {task.assignee.name.split(" ")[0]}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <User size={12} /> Unassigned
                      </span>
                    )}
                  </div>

                  {/* Status — inline editable by owner/manager/admin */}
                  <div onClick={e => e.stopPropagation()}>
                    <StatusSelector task={task} onUpdate={onUpdate} canEdit={canInline} />
                  </div>

                  {/* Phase — inline editable by owner/manager/admin */}
                  <div onClick={e => e.stopPropagation()}>
                    <PhaseSelector task={task} onUpdate={onUpdate} canEdit={canInline} />
                  </div>

                  {/* Priority */}
                  <div><PriorityDot priority={task.priority} /></div>

                  {/* Last updated */}
                  <div><RelativeTime date={task.last_updated_by_user || task.updated_at} /></div>

                  {/* Deadline */}
                  <div><DeadlineCell date={task.due_date} /></div>

                  {/* Row menu */}
                  <div onClick={e => e.stopPropagation()}>
                    <RowMenu task={task} onEdit={onEdit} onDelete={onDelete}
                      canEdit={canEdit} canDelete={canDelete} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function Tasks() {
  const toast = useToast();

  const [loading, setLoading]               = useState(true);
  const [tasks, setTasks]                   = useState([]);
  const [workflows, setWorkflows]           = useState([]);
  const [teamMembers, setTeamMembers]       = useState([]);
  const [search, setSearch]                 = useState("");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Read logged-in user from localStorage (populated at login)
  const currentUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  }, []);
  const role = currentUser?.role;

  // Modals
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToEdit, setTaskToEdit]           = useState(null);
  const [taskToDelete, setTaskToDelete]       = useState(null);
  const [creating, setCreating]               = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [deleting, setDeleting]               = useState(false);

  const blankNew  = { workflow_id: "", title: "", description: "", priority: "medium", assigned_to: "", due_date: "", phase: "" };
  const [newTask, setNewTask]   = useState(blankNew);
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
      console.error("Fetch failed:", err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  // ── Inline update (status or phase clicked in table) ───────────────────────

  const handleInlineUpdate = async (taskId, updates) => {
    // Optimistic update so UI feels instant
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, ...updates, last_updated_by_user: new Date().toISOString(), updated_at: new Date().toISOString() }
        : t
    ));
    try {
      await tasksAPI.update(taskId, updates);
      if (updates.status)
        toast.success(`Status → "${STATUS_CONFIG[updates.status]?.label}"`);
      if ("phase" in updates)
        toast.success(updates.phase ? `Phase → "${updates.phase}"` : "Phase cleared");
    } catch (err) {
      fetchAll(); // revert
      if (err.response?.status === 403) {
        toast.error("You can only update tasks assigned to you");
      } else {
        toast.error(err.response?.data?.message || "Update failed");
      }
    }
  };

  // ── Create ─────────────────────────────────────────────────────────────────

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      await tasksAPI.create({
        ...newTask,
        assigned_to: newTask.assigned_to  || null,
        due_date:    newTask.due_date     || null,
        phase:       newTask.phase        || null,
        workflow_id: parseInt(newTask.workflow_id),
      });
      toast.success("Task created");
      setShowAddModal(false);
      setNewTask(blankNew);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────

  const openEdit = (task) => {
    setTaskToEdit(task);
    setEditTask({
      title:       task.title       || "",
      description: task.description || "",
      priority:    task.priority    || "medium",
      assigned_to: task.assigned_to ? String(task.assigned_to) : "",
      status:      task.status      || "todo",
      due_date:    task.due_date    ? task.due_date.split("T")[0] : "",
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
        due_date:    editTask.due_date    || null,
        phase:       editTask.phase       || null,
      });
      toast.success("Task saved");
      setShowEditModal(false);
      setTaskToEdit(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const openDelete = (task) => { setTaskToDelete(task); setShowDeleteModal(true); };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await tasksAPI.delete(taskToDelete.id);
      toast.success("Task deleted");
      setShowDeleteModal(false);
      setTaskToDelete(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete task");
    } finally {
      setDeleting(false);
    }
  };

  // ── Filter + group by workflow ─────────────────────────────────────────────

  const filtered = useMemo(() => tasks.filter(t => {
    if (search         && !t.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter   !== "all" && t.status   !== statusFilter)   return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  }), [tasks, search, statusFilter, priorityFilter]);

  const grouped = useMemo(() => {
    const isFiltering = search || statusFilter !== "all" || priorityFilter !== "all";

    // Seed map from full workflows list (gives us title, status etc.)
    const map = new Map();
    workflows.forEach(w => map.set(w.id, { workflow: w, tasks: [] }));

    // Bucket filtered tasks
    filtered.forEach(t => {
      if (map.has(t.workflow_id)) {
        map.get(t.workflow_id).tasks.push(t);
      } else {
        // Workflow not in list — build a minimal placeholder from task data
        map.set(t.workflow_id, {
          workflow: { id: t.workflow_id, title: t.workflow_name || `Workflow #${t.workflow_id}`, status: "active" },
          tasks: [t],
        });
      }
    });

    // When filtering, hide groups with no matching tasks
    return Array.from(map.values()).filter(g => isFiltering ? g.tasks.length > 0 : true);
  }, [filtered, workflows, search, statusFilter, priorityFilter]);

  // ── Summary counts ─────────────────────────────────────────────────────────

  const counts = useMemo(() => ({
    total:       tasks.length,
    todo:        tasks.filter(t => t.status === "todo").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    review:      tasks.filter(t => t.status === "review").length,
    done:        tasks.filter(t => t.status === "done").length,
    overdue:     tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length,
  }), [tasks]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Tracker</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tasks grouped by workflow — click <strong>Status</strong> or <strong>Phase</strong> to update inline
          </p>
        </div>
        {(role === "admin" || role === "manager") && (
          <button onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/25">
            <Plus size={16} /> Add Task
          </button>
        )}
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: "Total",       value: counts.total,       color: "#6366f1" },
          { label: "To Do",       value: counts.todo,        color: "#6b7280" },
          { label: "In Progress", value: counts.in_progress, color: "#2563eb" },
          { label: "In Review",   value: counts.review,      color: "#d97706" },
          { label: "Done",        value: counts.done,        color: "#059669" },
          { label: "Overdue",     value: counts.overdue,     color: "#dc2626" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Member hint */}
      {role === "member" && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700">
          <span>💡</span>
          You can update <strong>Status</strong> and <strong>Phase</strong> on tasks assigned to you — just click the pill in the table row.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl flex-1 min-w-48 max-w-72">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input type="text" placeholder="Search tasks…" value={search}
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

      {/* Workflow groups */}
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
              onUpdate={handleInlineUpdate}
              onEdit={openEdit}
              onDelete={openDelete}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}

      {/* ── Add Task Modal ─────────────────────────────────────────────────── */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Task">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Workflow *</label>
            <select value={newTask.workflow_id}
              onChange={e => setNewTask({ ...newTask, workflow_id: e.target.value })} required className={inputCls}>
              <option value="">Select workflow…</option>
              {workflows.map(w => <option key={w.id} value={w.id}>{w.title || w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Task Title *</label>
            <input type="text" required value={newTask.title}
              onChange={e => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Enter task title" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })} className={inputCls}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignee</label>
              <select value={newTask.assigned_to} onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })} className={inputCls}>
                <option value="">Unassigned</option>
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phase</label>
              <select value={newTask.phase} onChange={e => setNewTask({ ...newTask, phase: e.target.value })} className={inputCls}>
                <option value="">No phase</option>
                {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
              <input type="date" value={newTask.due_date}
                onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea rows={2} value={newTask.description}
              onChange={e => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Optional…" className={`${inputCls} resize-none`} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setShowAddModal(false)}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={creating || !newTask.workflow_id || !newTask.title}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2">
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add Task
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Task Modal ────────────────────────────────────────────────── */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Task">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Task Title *</label>
            <input type="text" required value={editTask.title}
              onChange={e => setEditTask({ ...editTask, title: e.target.value })} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select value={editTask.status} onChange={e => setEditTask({ ...editTask, status: e.target.value })} className={inputCls}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select value={editTask.priority} onChange={e => setEditTask({ ...editTask, priority: e.target.value })} className={inputCls}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phase</label>
              <select value={editTask.phase} onChange={e => setEditTask({ ...editTask, phase: e.target.value })} className={inputCls}>
                <option value="">No phase</option>
                {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignee</label>
              <select value={editTask.assigned_to} onChange={e => setEditTask({ ...editTask, assigned_to: e.target.value })} className={inputCls}>
                <option value="">Unassigned</option>
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
            <input type="date" value={editTask.due_date}
              onChange={e => setEditTask({ ...editTask, due_date: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea rows={2} value={editTask.description}
              onChange={e => setEditTask({ ...editTask, description: e.target.value })}
              className={`${inputCls} resize-none`} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setShowEditModal(false)}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm ─────────────────────────────────────────────────── */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Task" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Are you sure you want to delete <strong className="text-gray-900">"{taskToDelete?.title}"</strong>?
            This cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowDeleteModal(false)}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleDelete} disabled={deleting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2">
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}