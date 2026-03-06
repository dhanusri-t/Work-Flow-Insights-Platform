import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List,
  ArrowUpDown,
  Loader2
} from "lucide-react";
import WorkflowCard from "../components/WorkflowCard";
import SearchBar from "../components/SearchBar";
import { Dropdown } from "../components/Dropdown";
import Modal from "../components/Modal";
import { workflowsAPI } from "../api/api";

const statusFilters = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
  { value: "draft", label: "Draft" },
];

const sortOptions = [
  { value: "recent", label: "Most Recent" },
  { value: "name", label: "Name (A-Z)" },
  { value: "progress", label: "Progress" },
];

export default function Workflows() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showNewWorkflowModal, setShowNewWorkflowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    status: "active"
  });

  useEffect(() => {
    fetchWorkflows();
  }, [statusFilter, searchQuery]);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      
      const res = await workflowsAPI.getAll(params);
      setWorkflows(res.data);
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      await workflowsAPI.create(newWorkflow);
      setShowNewWorkflowModal(false);
      setNewWorkflow({ name: "", description: "", status: "active" });
      fetchWorkflows();
    } catch (error) {
      console.error("Failed to create workflow:", error);
      alert("Failed to create workflow. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const filteredWorkflows = workflows
    .filter(w => {
      if (searchQuery && !w.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name": return (a.title || "").localeCompare(b.title || "");
        case "progress": 
          const aProgress = a.taskCount?.total ? a.taskCount.completed / a.taskCount.total : 0;
          const bProgress = b.taskCount?.total ? b.taskCount.completed / b.taskCount.total : 0;
          return bProgress - aProgress;
        default: return new Date(b.updated_at) - new Date(a.updated_at);
      }
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-500 mt-1">Manage and track all your workflow processes</p>
        </div>
        
        <button 
          onClick={() => setShowNewWorkflowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30"
        >
          <Plus size={20} />
          New Workflow
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search workflows..."
              onSearch={setSearchQuery}
              value={searchQuery}
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
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

            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-900">{filteredWorkflows.length}</span> workflows
            </p>
          </div>

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
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Created By</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Updated</th>
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
                          workflow.status === "paused" ? "bg-amber-100 text-amber-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {workflow.status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                          {workflow.status === "completed" && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                          {workflow.status === "paused" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                          {workflow.status === "draft" && <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
                          {(workflow.status || "draft").replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${workflow.taskCount?.total ? (workflow.taskCount.completed / workflow.taskCount.total) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
                            {workflow.taskCount?.completed || 0}/{workflow.taskCount?.total || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{workflow.creator_name || "Unknown"}</span>
                      </td>
                      <td className="px-6 py-4">
                        {workflow.updated_at && (
                          <span className="text-sm text-gray-600">
                            {new Date(workflow.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredWorkflows.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No workflows found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
              <button 
                onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={showNewWorkflowModal}
        onClose={() => setShowNewWorkflowModal(false)}
        title="Create New Workflow"
        size="lg"
      >
        <form onSubmit={handleCreateWorkflow} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Workflow Name *</label>
            <input
              type="text"
              value={newWorkflow.name}
              onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
              placeholder="Enter workflow name"
              required
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={newWorkflow.description}
              onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
              placeholder="Describe what this workflow does"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={newWorkflow.status}
              onChange={(e) => setNewWorkflow({ ...newWorkflow, status: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
            </select>
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
              disabled={creating || !newWorkflow.name}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Workflow
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
