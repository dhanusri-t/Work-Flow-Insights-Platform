import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List,
  ArrowUpDown,
  Calendar,
  Bell,
  MoreHorizontal
} from "lucide-react";
import KanbanBoard from "../components/KanbanBoard";
import SearchBar from "../components/SearchBar";
import { Dropdown } from "../components/Dropdown";
import Modal from "../components/Modal";
import Avatar from "../components/Avatar";

const allTasks = [
  { id: 1, title: "Send welcome email", status: "done", priority: "high", assignee: { name: "Sarah Chen" }, dueDate: new Date(), comments: 2 },
  { id: 2, title: "Prepare workstation", status: "done", priority: "high", assignee: { name: "Mike Johnson" }, dueDate: new Date(), comments: 0 },
  { id: 3, title: "Setup email account", status: "done", priority: "medium", assignee: { name: "Mike Johnson" }, dueDate: new Date(), comments: 1 },
  { id: 4, title: "Create company badges", status: "in_progress", priority: "medium", assignee: { name: "Emily Davis" }, dueDate: new Date(), comments: 3 },
  { id: 5, title: "Schedule orientation", status: "in_progress", priority: "high", assignee: { name: "Sarah Chen" }, dueDate: new Date(), comments: 1 },
  { id: 6, title: "Prepare onboarding materials", status: "todo", priority: "medium", assignee: { name: "Emily Davis" }, dueDate: new Date(), comments: 0 },
  { id: 7, title: "Assign buddy mentor", status: "todo", priority: "low", assignee: null, dueDate: new Date(), comments: 0 },
  { id: 8, title: "Setup software access", status: "todo", priority: "high", assignee: { name: "Mike Johnson" }, dueDate: new Date(), comments: 2 },
  { id: 9, title: "HR paperwork completion", status: "review", priority: "high", assignee: { name: "Sarah Chen" }, dueDate: new Date(), comments: 5 },
  { id: 10, title: "Team introduction meeting", status: "todo", priority: "low", assignee: null, dueDate: new Date(), comments: 0 },
  { id: 11, title: "Review quarterly budget", status: "in_progress", priority: "high", assignee: { name: "Alex Kim" }, dueDate: new Date(), comments: 1 },
  { id: 12, title: "Update client database", status: "review", priority: "medium", assignee: { name: "Emily Davis" }, dueDate: new Date(), comments: 0 },
];

const columns = [
  { id: "todo", title: "To Do", color: "bg-gray-500" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-500" },
  { id: "review", title: "In Review", color: "bg-amber-500" },
  { id: "done", title: "Done", color: "bg-emerald-500" },
];

const teamMembers = [
  { value: "all", label: "All Members" },
  { value: "Sarah Chen", label: "Sarah Chen" },
  { value: "Mike Johnson", label: "Mike Johnson" },
  { value: "Emily Davis", label: "Emily Davis" },
  { value: "Alex Kim", label: "Alex Kim" },
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
  const [searchQuery, setSearchQuery] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate");
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  const filteredTasks = allTasks
    .filter(task => {
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (memberFilter !== "all" && task.assignee?.name !== memberFilter) return false;
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "priority": 
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case "alphabetical": return a.title.localeCompare(b.title);
        case "created": return b.id - a.id;
        default: return new Date(a.dueDate) - new Date(b.dueDate);
      }
    });

  const handleTaskMove = (taskId, newStatus) => {
    console.log("Moving task", taskId, "to", newStatus);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">
            Manage and track all your tasks across workflows
          </p>
        </div>
        
        <button 
          onClick={() => setShowAddTaskModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30"
        >
          <Plus size={20} />
          Add Task
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1">
            <SearchBar
              placeholder="Search tasks..."
              onSearch={setSearchQuery}
              value={searchQuery}
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Member Filter */}
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-colors">
                  <Filter size={16} />
                  {teamMembers.find(m => m.value === memberFilter)?.label}
                </button>
              }
              items={teamMembers.map(m => ({
                label: m.label,
                checked: memberFilter === m.value,
                onClick: () => setMemberFilter(m.value),
              }))}
            />

            {/* Priority Filter */}
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

            {/* Sort */}
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

      {/* Stats Summary */}
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

      {/* Kanban Board */}
      <KanbanBoard
        columns={columns}
        tasks={filteredTasks}
        onTaskMove={handleTaskMove}
        onTaskClick={(task) => console.log("Clicked task:", task)}
        onAddTask={(columnId) => {
          console.log("Add task to:", columnId);
          setShowAddTaskModal(true);
        }}
      />

      {/* Add Task Modal */}
      <Modal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        title="Add New Task"
        size="md"
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              placeholder="Enter task title"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Priority
              </label>
              <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Assignee
            </label>
            <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
              <option value="">Unassigned</option>
              {teamMembers.filter(m => m.value !== "all").map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
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
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
            >
              Add Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
