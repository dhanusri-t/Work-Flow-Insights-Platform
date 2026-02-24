import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List,
  ArrowUpDown
} from "lucide-react";
import WorkflowCard from "../components/WorkflowCard";
import SearchBar from "../components/SearchBar";
import { Dropdown } from "../components/Dropdown";
import Modal from "../components/Modal";

const workflows = [
  {
    id: 1,
    title: "Employee Onboarding",
    description: "Complete onboarding process for new hires including documentation, training, and team introductions",
    status: "active",
    priority: "high",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    taskCount: { completed: 6, total: 10 },
    category: "HR",
    assignee: [
      { name: "Sarah Chen" },
      { name: "Mike Johnson" }
    ],
  },
  {
    id: 2,
    title: "Invoice Processing",
    description: "Monthly invoice approval workflow for vendor payments",
    status: "active",
    priority: "medium",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
    taskCount: { completed: 4, total: 8 },
    category: "Finance",
    assignee: [{ name: "Mike Johnson" }],
  },
  {
    id: 3,
    title: "Client Onboarding",
    description: "New client setup and welcome process with account creation",
    status: "completed",
    priority: "high",
    taskCount: { completed: 12, total: 12 },
    category: "Sales",
    assignee: [{ name: "Emily Davis" }],
  },
  {
    id: 4,
    title: "Q4 Planning",
    description: "Quarterly planning and goal setting for the operations team",
    status: "on_hold",
    priority: "medium",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    taskCount: { completed: 2, total: 15 },
    category: "Operations",
    assignee: [{ name: "Alex Kim" }],
  },
  {
    id: 5,
    title: "Product Launch",
    description: "Marketing and sales enablement for new product release",
    status: "active",
    priority: "high",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    taskCount: { completed: 8, total: 20 },
    category: "Marketing",
    assignee: [
      { name: "Sarah Chen" },
      { name: "Emily Davis" }
    ],
  },
  {
    id: 6,
    title: "Security Review",
    description: "Quarterly security audit and compliance check",
    status: "draft",
    priority: "low",
    taskCount: { completed: 0, total: 5 },
    category: "IT",
    assignee: [{ name: "Alex Kim" }],
  },
];

const statusFilters = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "draft", label: "Draft" },
  { value: "delayed", label: "Delayed" },
];

const categoryFilters = [
  { value: "all", label: "All Categories" },
  { value: "HR", label: "HR" },
  { value: "Finance", label: "Finance" },
  { value: "Sales", label: "Sales" },
  { value: "Operations", label: "Operations" },
  { value: "Marketing", label: "Marketing" },
  { value: "IT", label: "IT" },
];

const sortOptions = [
  { value: "recent", label: "Most Recent" },
  { value: "name", label: "Name (A-Z)" },
  { value: "dueDate", label: "Due Date" },
  { value: "progress", label: "Progress" },
];

export default function Workflows() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showNewWorkflowModal, setShowNewWorkflowModal] = useState(false);

  const filteredWorkflows = workflows
    .filter(w => {
      if (statusFilter !== "all" && w.status !== statusFilter) return false;
      if (categoryFilter !== "all" && w.category !== categoryFilter) return false;
      if (searchQuery && !w.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name": return a.title.localeCompare(b.title);
        case "dueDate": return (a.dueDate || 0) - (b.dueDate || 0);
        case "progress": return (b.taskCount.completed / b.taskCount.total) - (a.taskCount.completed / a.taskCount.total);
        default: return b.id - a.id;
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-500 mt-1">
            Manage and track all your workflow processes
          </p>
        </div>
        
        <button 
          onClick={() => setShowNewWorkflowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30"
        >
          <Plus size={20} />
          New Workflow
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1">
            <SearchBar
              placeholder="Search workflows..."
              onSearch={setSearchQuery}
              value={searchQuery}
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter */}
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-colors">
                  <Filter size={16} />
                  {statusFilters.find(s => s.value === statusFilter)?.label}
                </button>
              }
              items={statusFilters.map(s => ({
                label: s.label,
                checked: statusFilter === s.value,
                onClick: () => setStatusFilter(s.value),
              }))}
            />

            {/* Category Filter */}
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-colors">
                  {categoryFilters.find(c => c.value === categoryFilter)?.label}
                </button>
              }
              items={categoryFilters.map(c => ({
                label: c.label,
                checked: categoryFilter === c.value,
                onClick: () => setCategoryFilter(c.value),
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

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid" 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list" 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-900">{filteredWorkflows.length}</span> workflows
        </p>
      </div>

      {/* Workflows Display */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredWorkflows.map((workflow) => (
            <WorkflowCard 
              key={workflow.id}
              workflow={workflow}
              onClick={() => navigate(`/workflows/${workflow.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Workflow</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Progress</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredWorkflows.map((workflow) => (
                <tr 
                  key={workflow.id}
                  onClick={() => navigate(`/workflows/${workflow.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{workflow.title}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">{workflow.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      workflow.status === "active" ? "bg-emerald-100 text-emerald-700" :
                      workflow.status === "completed" ? "bg-blue-100 text-blue-700" :
                      workflow.status === "on_hold" ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {workflow.status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      {workflow.status === "completed" && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                      {workflow.status === "on_hold" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                      {workflow.status === "draft" && <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
                      {workflow.status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${(workflow.taskCount.completed / workflow.taskCount.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {workflow.taskCount.completed}/{workflow.taskCount.total}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{workflow.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    {workflow.dueDate && (
                      <span className={`text-sm ${
                        new Date(workflow.dueDate) < new Date() ? "text-red-500" : "text-gray-600"
                      }`}>
                        {new Date(workflow.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredWorkflows.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No workflows found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
          <button 
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setCategoryFilter("all");
            }}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* New Workflow Modal */}
      <Modal
        isOpen={showNewWorkflowModal}
        onClose={() => setShowNewWorkflowModal(false)}
        title="Create New Workflow"
        size="lg"
      >
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Workflow Name
            </label>
            <input
              type="text"
              placeholder="Enter workflow name"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe what this workflow does"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category
              </label>
              <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                <option value="">Select category</option>
                {categoryFilters.filter(c => c.value !== "all").map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

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

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowNewWorkflowModal(false)}
              className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30"
            >
              Create Workflow
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
