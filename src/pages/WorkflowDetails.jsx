import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Plus, MoreHorizontal, Loader2, Pencil,
  Edit, Trash2, Copy, Share2, MessageSquare,
  Clock, User, Flag, Calendar, CheckCircle2, Save, X
} from "lucide-react";
import Tabs from "../components/Tabs";
import KanbanBoard from "../components/KanbanBoard";
import Avatar from "../components/Avatar";
import { Dropdown } from "../components/Dropdown";
import Modal from "../components/Modal";
import ActivityFeed from "../components/ActivityFeed";
import { workflowsAPI, tasksAPI, teamAPI } from "../api/api";

const statusConfig = {
  active:      { label: "Active",      color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  completed:   { label: "Completed",   color: "bg-blue-100 text-blue-700",       dot: "bg-blue-500"    },
  paused:      { label: "Paused",      color: "bg-amber-100 text-amber-700",     dot: "bg-amber-500"   },
  on_hold:     { label: "On Hold",     color: "bg-orange-100 text-orange-700",   dot: "bg-orange-400"  },
  draft:       { label: "Draft",       color: "bg-gray-100 text-gray-700",       dot: "bg-gray-400"    },
  todo:        { label: "To Do",       color: "bg-gray-100 text-gray-700",       dot: "bg-gray-400"    },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700",       dot: "bg-blue-500"    },
  review:      { label: "In Review",   color: "bg-amber-100 text-amber-700",     dot: "bg-amber-500"   },
  done:        { label: "Done",        color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
};

const priorityConfig = {
  high:   { label: "High",   color: "text-red-600",   bg: "bg-red-100"   },
  medium: { label: "Medium", color: "text-amber-600", bg: "bg-amber-100" },
  low:    { label: "Low",    color: "text-gray-600",  bg: "bg-gray-100"  },
};

export default function WorkflowDetails() {
  const navigate = useNavigate();
  const { id }   = useParams();

  const [loading, setLoading]           = useState(true);
  const [workflow, setWorkflow]         = useState(null);
  const [teamMembers, setTeamMembers]   = useState([]);
  const [activeTab, setActiveTab]       = useState(0);

  // ── Modals ────────────────────────────────────────────────────────────────
  const [showAddTaskModal, setShowAddTaskModal]     = useState(false);
  const [showEditWfModal, setShowEditWfModal]       = useState(false);
  const [showDeleteWfModal, setShowDeleteWfModal]   = useState(false);
  const [showEditTaskModal, setShowEditTaskModal]   = useState(false);
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [selectedTask, setSelectedTask]             = useState(null);
  const [taskToEdit, setTaskToEdit]                 = useState(null);
  const [taskToDelete, setTaskToDelete]             = useState(null);

  // ── Loading states ────────────────────────────────────────────────────────
  const [creating, setCreating]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);

  // ── Forms ─────────────────────────────────────────────────────────────────
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", assigned_to: "" });
  const [editWf,  setEditWf]  = useState({ name: "", description: "", status: "active" });
  const [editTask, setEditTask] = useState({ title: "", description: "", priority: "medium", assigned_to: "", status: "todo" });

  useEffect(() => { fetchWorkflow(); fetchTeamMembers(); }, [id]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const res = await workflowsAPI.getById(id);
      setWorkflow(res.data);
    } catch (err) {
      console.error("Failed to fetch workflow:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await teamAPI.getAll();
      setTeamMembers(res.data);
    } catch (err) {
      console.error("Failed to fetch team:", err);
    }
  };

  // ── Create task ───────────────────────────────────────────────────────────
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      await tasksAPI.create({ workflow_id: parseInt(id), ...newTask, assigned_to: newTask.assigned_to || null });
      setShowAddTaskModal(false);
      setNewTask({ title: "", description: "", priority: "medium", assigned_to: "" });
      fetchWorkflow();
    } catch (err) {
      console.error("Failed to create task:", err);
      alert("Failed to create task.");
    } finally {
      setCreating(false);
    }
  };

  // ── Edit workflow ─────────────────────────────────────────────────────────
  const openEditWorkflow = () => {
    setEditWf({ name: workflow.title || "", description: workflow.description || "", status: workflow.status || "active" });
    setShowEditWfModal(true);
  };

  const handleSaveWorkflow = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await workflowsAPI.update(id, editWf);
      setShowEditWfModal(false);
      fetchWorkflow();
    } catch (err) {
      console.error("Failed to update workflow:", err);
      alert(err.response?.data?.message || "Failed to update workflow.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete workflow ───────────────────────────────────────────────────────
  const handleDeleteWorkflow = async () => {
    try {
      setDeleting(true);
      await workflowsAPI.delete(id);
      navigate("/workflows");
    } catch (err) {
      console.error("Failed to delete workflow:", err);
      alert(err.response?.data?.message || "Failed to delete workflow.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Edit task ─────────────────────────────────────────────────────────────
  const openEditTask = (task) => {
    setTaskToEdit(task);
    setEditTask({
      title:       task.title       || "",
      description: task.description || "",
      priority:    task.priority    || "medium",
      assigned_to: task.assigned_to || "",
      status:      task.status      || "todo",
    });
    setShowEditTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await tasksAPI.update(taskToEdit.id, { ...editTask, assigned_to: editTask.assigned_to || null });
      setShowEditTaskModal(false);
      setTaskToEdit(null);
      fetchWorkflow();
    } catch (err) {
      console.error("Failed to update task:", err);
      alert(err.response?.data?.message || "Failed to update task.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete task ───────────────────────────────────────────────────────────
  const openDeleteTask = (task) => { setTaskToDelete(task); setShowDeleteTaskModal(true); };

  const handleDeleteTask = async () => {
    try {
      setDeleting(true);
      await tasksAPI.delete(taskToDelete.id);
      setShowDeleteTaskModal(false);
      setTaskToDelete(null);
      fetchWorkflow();
    } catch (err) {
      console.error("Failed to delete task:", err);
      alert(err.response?.data?.message || "Failed to delete task.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Drag move ─────────────────────────────────────────────────────────────
  const handleTaskMove = async (taskId, newStatus) => {
    // Optimistic update
    setWorkflow(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t),
    }));
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      fetchWorkflow(); // re-sync
    } catch (err) {
      console.error("Failed to move task:", err);
      fetchWorkflow(); // revert
    }
  };

  // ── Task detail click ─────────────────────────────────────────────────────
  const handleTaskClick = async (task) => {
    try {
      const res = await tasksAPI.getById(task.id);
      setSelectedTask(res.data);
    } catch {
      setSelectedTask(task);
    }
  };

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "N/A";

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (!workflow) return (
    <div className="text-center py-12">
      <p className="text-gray-500">Workflow not found</p>
      <button onClick={() => navigate("/workflows")} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">Back to Workflows</button>
    </div>
  );

  const completedTasks = workflow.tasks?.filter(t => t.status === "done").length || 0;
  const totalTasks     = workflow.tasks?.length || 0;
  const progress       = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const currentStatus  = statusConfig[workflow.status] || statusConfig.draft;

  const getAssignees = () => {
    const map = new Map();
    workflow.tasks?.forEach(t => { if (t.assignee) map.set(t.assignee.id, t.assignee); });
    return Array.from(map.values());
  };

  // ── Tab content ───────────────────────────────────────────────────────────
  const OverviewTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
          <p className="text-gray-600 leading-relaxed">{workflow.description || "No description provided."}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
            <span className="text-2xl font-bold text-indigo-600">{progress}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { label: "To Do",       value: workflow.tasks?.filter(t => t.status === "todo").length || 0,        cls: "text-gray-900"    },
              { label: "In Progress", value: workflow.tasks?.filter(t => t.status === "in_progress").length || 0, cls: "text-blue-600"    },
              { label: "In Review",   value: workflow.tasks?.filter(t => t.status === "review").length || 0,      cls: "text-amber-600"   },
              { label: "Done",        value: completedTasks,                                                       cls: "text-emerald-600" },
            ].map(s => (
              <div key={s.label}>
                <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${currentStatus.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`} />{currentStatus.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Created</span>
              <span className="text-gray-900">{formatDate(workflow.created_at)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Updated</span>
              <span className="text-gray-900">{formatDate(workflow.updated_at)}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar name={workflow.creator_name || "Unknown"} size="sm" />
              <div>
                <p className="text-sm font-medium text-gray-900">{workflow.creator_name}</p>
                <p className="text-xs text-gray-500">Owner</p>
              </div>
            </div>
            {getAssignees().map(a => (
              <div key={a.id} className="flex items-center gap-3">
                <Avatar name={a.name} size="sm" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.name}</p>
                  <p className="text-xs text-gray-500">Assignee</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const TasksTab = () => (
    <KanbanBoard
      tasks={workflow.tasks || []}
      onTaskMove={handleTaskMove}
      onTaskClick={handleTaskClick}
      onTaskEdit={openEditTask}
      onTaskDelete={openDeleteTask}
      onAddTask={(columnId) => { setNewTask({ title: "", description: "", priority: "medium", assigned_to: "", status: columnId }); setShowAddTaskModal(true); }}
    />
  );

  const TimelineTab = () => (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Timeline</h3>
      {workflow.tasks?.length > 0 ? (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
          {[...workflow.tasks].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(task => (
            <div key={task.id} className="relative pl-10 pb-8 last:pb-0">
              <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-white ${
                task.status === "done" ? "bg-emerald-500" : task.status === "in_progress" ? "bg-blue-500" : task.status === "review" ? "bg-amber-500" : "bg-gray-300"
              }`} style={{ top: 0 }} />
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(task.created_at)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[task.status]?.color || "bg-gray-100 text-gray-700"}`}>
                    {task.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No tasks yet</p>
      )}
    </div>
  );

  const tabs = [
    { label: "Overview",  content: <OverviewTab /> },
    { label: "Tasks",     content: <TasksTab /> },
    { label: "Timeline",  content: <TimelineTab /> },
    { label: "Activity",  content: <ActivityFeed /> },
  ];

  // ── Input class helper ────────────────────────────────────────────────────
  const inputCls = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500";

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate("/workflows")} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{workflow.title}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${currentStatus.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`} />{currentStatus.label}
              </span>
            </div>
            <p className="text-gray-500 mt-1">Created {formatDate(workflow.created_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
          >
            <Plus size={18} /> Add Task
          </button>

          <Dropdown
            trigger={
              <button className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
                <MoreHorizontal size={20} />
              </button>
            }
            items={[
              { label: "Edit Workflow", icon: <Edit size={16} />,   onClick: openEditWorkflow },
              { label: "Duplicate",     icon: <Copy size={16} />,   onClick: () => {} },
              { label: "Share",         icon: <Share2 size={16} />, onClick: () => {} },
              { divider: true },
              { label: "Delete Workflow", danger: true, icon: <Trash2 size={16} />, onClick: () => setShowDeleteWfModal(true) },
            ]}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-semibold text-gray-900">{completedTasks} of {totalTasks} tasks</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <Tabs tabs={tabs} defaultTab={activeTab} onChange={setActiveTab} />

      {/* ── Add Task Modal ──────────────────────────────────────────────────── */}
      <Modal isOpen={showAddTaskModal} onClose={() => setShowAddTaskModal(false)} title="Add New Task" size="md">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Task Title *</label>
            <input type="text" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="Enter task title" required className={inputCls} />
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea rows={3} value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="Add a description..." className={`${inputCls} resize-none`} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowAddTaskModal(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={creating || !newTask.title} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium disabled:opacity-70 flex items-center gap-2">
              {creating && <Loader2 className="w-4 h-4 animate-spin" />} Add Task
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Workflow Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={showEditWfModal} onClose={() => setShowEditWfModal(false)} title="Edit Workflow" size="md">
        <form onSubmit={handleSaveWorkflow} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Workflow Name *</label>
            <input type="text" value={editWf.name} onChange={e => setEditWf({ ...editWf, name: e.target.value })} required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea rows={3} value={editWf.description} onChange={e => setEditWf({ ...editWf, description: e.target.value })} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select value={editWf.status} onChange={e => setEditWf({ ...editWf, status: e.target.value })} className={inputCls}>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowEditWfModal(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium disabled:opacity-70 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}<Save size={16} /> Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Workflow Confirm ─────────────────────────────────────────── */}
      <Modal isOpen={showDeleteWfModal} onClose={() => setShowDeleteWfModal(false)} title="Delete Workflow" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600">Are you sure you want to delete <strong>{workflow.title}</strong>? This will also delete all tasks in this workflow. This action cannot be undone.</p>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowDeleteWfModal(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={handleDeleteWorkflow} disabled={deleting} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium disabled:opacity-70 flex items-center gap-2">
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}<Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Task Modal ─────────────────────────────────────────────────── */}
      <Modal isOpen={showEditTaskModal} onClose={() => setShowEditTaskModal(false)} title="Edit Task" size="md">
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Task Title *</label>
            <input type="text" value={editTask.title} onChange={e => setEditTask({ ...editTask, title: e.target.value })} required className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select value={editTask.status} onChange={e => setEditTask({ ...editTask, status: e.target.value })} className={inputCls}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="done">Done</option>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignee</label>
            <select value={editTask.assigned_to} onChange={e => setEditTask({ ...editTask, assigned_to: e.target.value })} className={inputCls}>
              <option value="">Unassigned</option>
              {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea rows={3} value={editTask.description} onChange={e => setEditTask({ ...editTask, description: e.target.value })} className={`${inputCls} resize-none`} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowEditTaskModal(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium disabled:opacity-70 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}<Save size={16} /> Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Task Confirm ─────────────────────────────────────────────── */}
      <Modal isOpen={showDeleteTaskModal} onClose={() => setShowDeleteTaskModal(false)} title="Delete Task" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600">Are you sure you want to delete <strong>{taskToDelete?.title}</strong>? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowDeleteTaskModal(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={handleDeleteTask} disabled={deleting} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium disabled:opacity-70 flex items-center gap-2">
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}<Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Task Detail Modal ───────────────────────────────────────────────── */}
      <Modal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} title="Task Details" size="lg">
        {selectedTask && (
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900">{selectedTask.title}</h2>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[selectedTask.status]?.color || ""}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[selectedTask.status]?.dot || ""}`} />
                  {statusConfig[selectedTask.status]?.label || selectedTask.status}
                </span>
              </div>
              {selectedTask.description && <p className="mt-3 text-gray-600">{selectedTask.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Priority", icon: <Flag size={20} className={priorityConfig[selectedTask.priority]?.color} />, bg: priorityConfig[selectedTask.priority]?.bg, value: priorityConfig[selectedTask.priority]?.label },
                { label: "Assignee", icon: <User size={20} className="text-blue-600" />, bg: "bg-blue-100", value: selectedTask.assignee?.name || "Unassigned" },
                { label: "Created",  icon: <Clock size={20} className="text-purple-600" />, bg: "bg-purple-100", value: formatDate(selectedTask.created_at) },
                { label: "Due Date", icon: <Calendar size={20} className="text-amber-600" />, bg: "bg-amber-100", value: formatDate(selectedTask.due_date) },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className={`p-2 rounded-lg ${item.bg}`}>{item.icon}</div>
                  <div><p className="text-sm text-gray-500">{item.label}</p><p className="font-medium text-gray-900">{item.value}</p></div>
                </div>
              ))}
            </div>
            {selectedTask.status_logs?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Activity</h3>
                <div className="space-y-3">
                  {selectedTask.status_logs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle2 size={20} className="text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-900">Status changed from <strong>{log.old_status || "New"}</strong> to <strong>{log.new_status}</strong></p>
                        <p className="text-xs text-gray-500">by {log.changer_name} • {formatDate(log.changed_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-between pt-4 border-t">
              <button onClick={() => { setSelectedTask(null); openEditTask(selectedTask); }} className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2">
                <Pencil size={15} /> Edit Task
              </button>
              <button onClick={() => setSelectedTask(null)} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}