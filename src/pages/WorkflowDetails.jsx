import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  Users, 
  Clock,
  Play,
  Pause,
  Edit,
  Trash2,
  Copy,
  Share2,
  MessageSquare,
  Paperclip
} from "lucide-react";
import Tabs from "../components/Tabs";
import KanbanBoard from "../components/KanbanBoard";
import Avatar from "../components/Avatar";
import { Dropdown } from "../components/Dropdown";
import Modal from "../components/Modal";
import ActivityFeed from "../components/ActivityFeed";

const workflowData = {
  id: 1,
  title: "Employee Onboarding",
  description: "Complete onboarding process for new hires including documentation, training, equipment setup, and team introductions.",
  status: "active",
  priority: "high",
  category: "HR",
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
  dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
  owner: { name: "Sarah Chen", avatar: null },
  assignees: [
    { name: "Sarah Chen" },
    { name: "Mike Johnson" },
    { name: "Emily Davis" }
  ],
  tasks: [
    { id: 1, title: "Send welcome email", status: "done", priority: "high", assignee: { name: "Sarah Chen" }, comments: 2 },
    { id: 2, title: "Prepare workstation", status: "done", priority: "high", assignee: { name: "Mike Johnson" }, comments: 0 },
    { id: 3, title: "Setup email account", status: "done", priority: "medium", assignee: { name: "Mike Johnson" }, comments: 1 },
    { id: 4, title: "Create company badges", status: "in_progress", priority: "medium", assignee: { name: "Emily Davis" }, comments: 3 },
    { id: 5, title: "Schedule orientation", status: "in_progress", priority: "high", assignee: { name: "Sarah Chen" }, comments: 1 },
    { id: 6, title: "Prepare onboarding materials", status: "todo", priority: "medium", assignee: { name: "Emily Davis" }, comments: 0 },
    { id: 7, title: "Assign buddy mentor", status: "todo", priority: "low", assignee: null, comments: 0 },
    { id: 8, title: "Setup software access", status: "todo", priority: "high", assignee: { name: "Mike Johnson" }, comments: 2 },
    { id: 9, title: "HR paperwork completion", status: "review", priority: "high", assignee: { name: "Sarah Chen" }, comments: 5 },
    { id: 10, title: "Team introduction meeting", status: "todo", priority: "low", assignee: null, comments: 0 },
  ]
};

const statusConfig = {
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  delayed: { label: "Delayed", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700", dot: "bg-gray-400" },
  on_hold: { label: "On Hold", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
};

export default function WorkflowDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState(0);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  const workflow = workflowData;
  const completedTasks = workflow.tasks.filter(t => t.status === "done").length;
  const progress = Math.round((completedTasks / workflow.tasks.length) * 100);
  const currentStatus = statusConfig[workflow.status];

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  const handleTaskMove = (taskId, newStatus) => {
    console.log("Moving task", taskId, "to", newStatus);
  };

  const OverviewTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Info */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
          <p className="text-gray-600 leading-relaxed">{workflow.description}</p>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
            <span className="text-2xl font-bold text-indigo-600">{progress}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{workflow.tasks.filter(t => t.status === "todo").length}</p>
              <p className="text-sm text-gray-500">To Do</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{workflow.tasks.filter(t => t.status === "in_progress").length}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{workflow.tasks.filter(t => t.status === "review").length}</p>
              <p className="text-sm text-gray-500">In Review</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{completedTasks}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Details Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${currentStatus.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`} />
                {currentStatus.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Priority</span>
              <span className="text-red-500 font-medium">🔴 High</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Category</span>
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
                {workflow.category}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Created</span>
              <span className="text-gray-900">{formatDate(workflow.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Due Date</span>
              <span className={`${new Date(workflow.dueDate) < new Date() ? "text-red-500" : "text-gray-900"}`}>
                {formatDate(workflow.dueDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Team Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar name={workflow.owner.name} size="sm" />
              <div>
                <p className="text-sm font-medium text-gray-900">{workflow.owner.name}</p>
                <p className="text-xs text-gray-500">Owner</p>
              </div>
            </div>
            {workflow.assignees.map((assignee) => (
              <div key={assignee.name} className="flex items-center gap-3">
                <Avatar name={assignee.name} size="sm" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{assignee.name}</p>
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
      tasks={workflow.tasks}
      onTaskMove={handleTaskMove}
      onTaskClick={(task) => console.log("Clicked task:", task)}
      onAddTask={(columnId) => {
        console.log("Add task to:", columnId);
        setShowAddTaskModal(true);
      }}
    />
  );

  const TimelineTab = () => (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Timeline</h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        {workflow.tasks
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .map((task, index) => (
            <div key={task.id} className="relative pl-10 pb-8 last:pb-0">
              <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-white ${
                task.status === "done" ? "bg-emerald-500" :
                task.status === "in_progress" ? "bg-blue-500" :
                task.status === "review" ? "bg-amber-500" :
                "bg-gray-300"
              }`} style={{ top: 0 }} />
              
              <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(task.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.comments > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MessageSquare size={14} />
                        {task.comments}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      task.status === "done" ? "bg-emerald-100 text-emerald-700" :
                      task.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                      task.status === "review" ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const tabs = [
    { label: "Overview", content: <OverviewTab /> },
    { label: "Tasks", content: <TasksTab /> },
    { label: "Timeline", content: <TimelineTab /> },
    { label: "Activity", content: <ActivityFeed /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate("/workflows")}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{workflow.title}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${currentStatus.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`} />
                {currentStatus.label}
              </span>
            </div>
            <p className="text-gray-500 mt-1">
              {workflow.category} • Created {formatDate(workflow.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
          >
            <Plus size={18} />
            Add Task
          </button>

          <Dropdown
            trigger={
              <button className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
                <MoreHorizontal size={20} />
              </button>
            }
            items={[
              { label: "Edit Workflow", icon: <Edit size={16} />, onClick: () => {} },
              { label: "Duplicate", icon: <Copy size={16} />, onClick: () => {} },
              { label: "Share", icon: <Share2 size={16} />, onClick: () => {} },
              { divider: true },
              { label: "Archive", onClick: () => {} },
              { label: "Delete", danger: true, icon: <Trash2 size={16} />, onClick: () => {} },
            ]}
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-semibold text-gray-900">{completedTasks} of {workflow.tasks.length} tasks</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs 
        tabs={tabs} 
        defaultTab={activeTab}
        onChange={setActiveTab}
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
              {workflow.assignees.map(a => (
                <option key={a.name} value={a.name}>{a.name}</option>
              ))}
            </select>
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
