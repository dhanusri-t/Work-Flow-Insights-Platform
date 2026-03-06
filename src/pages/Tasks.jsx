import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown,
  Loader2
} from "lucide-react";
import KanbanBoard from "../components/KanbanBoard";
import SearchBar from "../components/SearchBar";
import { Dropdown } from "../components/Dropdown";
import Modal from "../components/Modal";
import Avatar from "../components/Avatar";
import { tasksAPI, workflowsAPI, teamAPI } from "../api/api";

const columns = [
  { id: "todo", title: "To Do", color: "bg-gray-500" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-500" },
  { id: "review", title: "In Review", color: "bg-amber-500" },
  { id: "done", title: "Done", color: "bg-emerald-500" },
];

const priorityFilters = [
  { value: "all", label: "All Priorities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const sortOptions = [
  { value: "dueDate", label: "Due Date" },
  { value: "priority", label: "Priority" },
  { value: "created", label: "Created" },
  { value: "alphabetical", label: "Alphabetical" },
];

export default function Tasks() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate");
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [newTask, setNewTask] = useState({
    workflow_id: "",
    title: "",
    description: "",
    priority: "medium",
    assigned_to: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [workflowFilter, priorityFilter, memberFilter, searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, workflowsRes, teamRes] = await Promise.all([
        tasksAPI.getAll(),
        workflowsAPI.getAll(),
        teamAPI.getAll()
      ]);
      
      setTasks(tasksRes.data);
      setWorkflows(workflowsRes.data);
      setTeamMembers(teamRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const params = {};
      if (workflowFilter !== "all") params.workflow_id = workflowFilter;
      if (priorityFilter !== "all") params.priority = priorityFilter;
      if (memberFilter !== "all") params.assigned_to = memberFilter;
      if (searchQuery) params.search = searchQuery;
      
      const res = await tasksAPI.getAll(params);
      setTasks(res.data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const taskData = {
        ...newTask,
        assigned_to: newTask.assigned_to || null
      };
      await tasksAPI.create(taskData);
      setShowAddTaskModal(false);
      setNewTask({ workflow_id: "", title: "", description: "", priority: "medium", assigned_to: "" });
      fetchTasks();
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Failed to create task. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleTaskMove = async (taskId, newStatus) => {
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const filteredTasks = tasks
    .filter(task => {
      if (searchQuery && !task.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "priority": 
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
        case "alphabetical": return (a.title || "").localeCompare(b.title || "");
        case "created": return b.id - a.id;
        default: return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  const workflowOptions = [
    { value: "all", label: "All Workflows" },
    ...workflows.map(w => ({ value: w.id.toString(), label: w.title }))
  ];

  const memberOptions = [
    { value: "all", label: "All Members" },
    ...teamMembers.map(m => ({ value: m.id.toString(), label: m.name }))
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">Manage and track all your tasks across workflows</p>
        </div>
        
        <button 
          onClick={() => setShowAddTaskModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30"
        >
          <Plus size={20} />
          Add Task
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search tasks..."
              onSearch={setSearchQuery}
              value={searchQuery}
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-colors">
                  <Filter size={16} />
                  {workflowOptions.find(w => w.value === workflowFilter)?.label || "All Workflows"}
                </button>
              }
              items={workflowOptions.map(w => ({
                label: w.label,
                checked: workflowFilter === w.value,
                onClick: () => setWorkflowFilter(w.value),
              }))}
            />

            <Dropdown
              trigger={
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-colors">
                  {memberOptions.find(m => m.value === memberFilter)?.label || "All Members"}
                </button>
              }
              items={memberOptions.map(m => ({
                label: m.label,
                checked: memberFilter === m.value,
                onClick: () => setMemberFilter(m.value),
              }))}
            />

            <Dropdown
              trigger={
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-colors">
                  {priorityFilters.find(p => p.value === priorityFilter)?.label}
                </button>
              }
              items={priorityFilters.map(p => ({
                label: p.label,
                checked: priorityFilter === p.value,
                onClick: () => setPriorityFilter(p.value),
              }))}
            />

            <Dropdown
              trigger={
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-colors">
                  <ArrowUpDown size={16} />
                  {sortOptions.find(s => s.value === sortBy)?.label}
                </button>
              }
              items={sortOptions.map(s => ({
                label: s.label,
                checked: sortBy === s.value,
                onClick: () => setSortBy(s.value),
              }))}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {columns.map(column => {
          const count = filteredTasks.filter(t => t.status === column.id).length;
          return (
            <div key={column.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
                <span className="text-sm font-medium text-gray-600">{column.title}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          );
        })}
      </div>

      <KanbanBoard
        columns={columns}
        tasks={filteredTasks}
        onTaskMove={handleTaskMove}
        onTaskClick={(task) => console.log("Clicked task:", task)}
        onAddTask={(columnId) => {
          setNewTask({ ...newTask, status: columnId });
          setShowAddTaskModal(true);
        }}
      />

      <Modal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        title="Add New Task"
        size="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Workflow *</label>
            <select
              value={newTask.workflow_id}
              onChange={(e) => setNewTask({ ...newTask, workflow_id: e.target.value })}
              required
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">Select workflow</option>
              {workflows.map(w => (
                <option key={w.id} value={w.id}>{w.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Task Title *</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Enter task title"
              required
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignee</label>
              <select
                value={newTask.assigned_to}
                onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">Unassigned</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Add a description..."
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddTaskModal(false)}
              className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !newTask.workflow_id || !newTask.title}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
