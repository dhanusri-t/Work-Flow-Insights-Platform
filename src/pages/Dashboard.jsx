import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, Plus, ArrowRight, Play, CheckCircle2,
  Timer, Users, Loader2, Bell, CheckCircle, AlertCircle,
  Info, LayoutGrid, ListChecks, Zap, Clock, TrendingUp,
  UserPlus, CheckSquare,
} from "lucide-react";

import WorkflowCard from "../components/WorkflowCard";
import ActivityFeed from "../components/ActivityFeed";
import Avatar from "../components/Avatar";
import Modal from "../components/Modal";
import { dashboardAPI, workflowsAPI } from "../api/api";

function Alert({ type, title, message, time }) {
  const styles = {
    success: { bg: "rgba(16,185,129,0.06)",  border: "rgba(16,185,129,0.2)",  icon: "#10b981" },
    warning: { bg: "rgba(245,158,11,0.06)",  border: "rgba(245,158,11,0.2)",  icon: "#f59e0b" },
    info:    { bg: "rgba(59,130,246,0.06)",   border: "rgba(59,130,246,0.2)",  icon: "#3b82f6" },
    error:   { bg: "rgba(239,68,68,0.06)",    border: "rgba(239,68,68,0.2)",   icon: "#ef4444" },
  };
  const icons = { success: CheckCircle, warning: AlertTriangle, info: Info, error: AlertCircle };
  const Icon = icons[type] || Info;
  const s = styles[type] || styles.info;
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl"
      style={{ background: s.bg, border: `1.5px solid ${s.border}`, boxShadow: `0 2px 12px ${s.border}` }}>
      <div className="mt-0.5 p-1.5 rounded-lg" style={{ background: `${s.icon}18` }}>
        <Icon size={16} style={{ color: s.icon }} />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-sm text-gray-500 mt-0.5">{message}</p>
      </div>
      <span className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">{time}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accentColor, iconBg, iconColor }) {
  return (
    <div className="relative rounded-2xl p-5 overflow-hidden cursor-default"
      style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", transition: "box-shadow 0.2s, transform 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.09)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}>
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl" style={{ background: accentColor }} />
      <div className="flex items-start justify-between pl-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>{label}</p>
          <p className="text-4xl font-bold text-gray-900 leading-none">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
        </div>
        <div className="p-3 rounded-xl" style={{ background: iconBg }}>
          <Icon size={20} style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading]             = useState(true);
  const [stats, setStats]                 = useState(null);
  const [recentWorkflows, setRecentWorkflows] = useState([]);
  const [teamMembers, setTeamMembers]     = useState([]);
  const [activities, setActivities]       = useState([]);
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [newWfName, setNewWfName]         = useState("");
  const [creatingWf, setCreatingWf]       = useState(false);

  const user = JSON.parse(localStorage.getItem("user")) || { name: "Admin" };
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";

  // ── Quick actions — all wired up ────────────────────────────────────────
  const quickActions = [
    {
      icon: Play,
      label: "New Workflow",
      gradient: "linear-gradient(135deg,#10b981,#059669)",
      shadow: "rgba(16,185,129,0.35)",
      onClick: () => setShowNewWorkflow(true),
    },
    {
      icon: CheckSquare,
      label: "Go to Tasks",
      gradient: "linear-gradient(135deg,#3b82f6,#2563eb)",
      shadow: "rgba(59,130,246,0.35)",
      onClick: () => navigate("/tasks"),
    },
    {
      icon: UserPlus,
      label: "Invite Member",
      gradient: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
      shadow: "rgba(139,92,246,0.35)",
      onClick: () => navigate("/team"),
    },
    {
      icon: LayoutGrid,
      label: "All Workflows",
      gradient: "linear-gradient(135deg,#f59e0b,#d97706)",
      shadow: "rgba(245,158,11,0.35)",
      onClick: () => navigate("/workflows"),
    },
  ];

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, workflowsRes] = await Promise.all([
        dashboardAPI.getStats(),
        workflowsAPI.getAll(),
      ]);
      const transformedActivities = (statsRes.data.recentActivity || []).map(activity => ({
        id: activity.id,
        user: { name: activity.updated_by || "Unknown" },
        action: activity.status === "done" ? "completed" : "updated",
        target: activity.title,
        timestamp: new Date(activity.updated_at),
      }));
      setStats(statsRes.data.stats);
      setRecentWorkflows(workflowsRes.data.slice(0, 4));
      setTeamMembers(statsRes.data.teamMembers);
      setActivities(transformedActivities);
    } catch (error) {
      console.error("Dashboard fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async (e) => {
    e.preventDefault();
    if (!newWfName.trim()) return;
    try {
      setCreatingWf(true);
      await workflowsAPI.create({ name: newWfName.trim(), status: "active" });
      setShowNewWorkflow(false);
      setNewWfName("");
      fetchDashboardData();
      navigate("/workflows");
    } catch (err) {
      console.error("Failed to create workflow:", err);
      alert(err.response?.data?.message || "Failed to create workflow.");
    } finally {
      setCreatingWf(false);
    }
  };

  const getAlerts = () => {
    if (!stats) return [];
    const alerts = [];
    if (stats.delayedTasks > 0) alerts.push({ type: "warning", title: "Delayed Tasks", message: `${stats.delayedTasks} tasks need attention`, time: "Now" });
    if (stats.completedWorkflows > 0) alerts.push({ type: "success", title: "Workflows Completed", message: `${stats.completedWorkflows} workflows completed successfully`, time: "Today" });
    return alerts;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );

  const totalTasks = stats?.totalTasks || 0;

  return (
    <div className="space-y-6 min-h-screen p-6"
      style={{ background: "linear-gradient(160deg, #f5f5ff 0%, #f8f9fc 60%, #f0f4ff 100%)" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {greeting}, {user.name?.split(" ")[0]}.
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Here's your workflow summary today.</p>
        </div>
        <button
          onClick={() => setShowNewWorkflow(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-semibold text-sm transition-all"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", boxShadow: "0 4px 15px rgba(99,102,241,0.4)" }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 25px rgba(99,102,241,0.5)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 15px rgba(99,102,241,0.4)"; e.currentTarget.style.transform = "translateY(0)"; }}>
          <Plus size={18} /> New Workflow
        </button>
      </div>

      {/* Alerts */}
      {getAlerts().length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-gray-500" />
            <h2 className="text-base font-semibold text-gray-800">Notifications</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getAlerts().map((alert, i) => <Alert key={i} {...alert} />)}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="rounded-2xl p-6"
        style={{ background: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(99,102,241,0.1)", boxShadow: "0 4px 24px rgba(99,102,241,0.07)", backdropFilter: "blur(12px)" }}>
        <div className="mb-5 flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(79,70,229,0.08))" }}>
            <TrendingUp size={18} style={{ color: "#6366f1" }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Dashboard Overview</h2>
            <p className="text-xs text-gray-400">Live workflow metrics</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard icon={ListChecks}   label="Total Tasks"       value={totalTasks}                                           sub="Across all workflows"                    accentColor="#6366f1" iconBg="rgba(99,102,241,0.1)"  iconColor="#6366f1" />
          <StatCard icon={CheckCircle2} label="Completed"         value={stats?.doneTasks || 0}                                sub={`${stats?.teamEfficiency || 0}% efficiency`} accentColor="#10b981" iconBg="rgba(16,185,129,0.1)"  iconColor="#10b981" />
          <StatCard icon={Zap}          label="In Progress"       value={stats?.inProgressTasks || 0}                         sub="Currently active"                        accentColor="#3b82f6" iconBg="rgba(59,130,246,0.1)"  iconColor="#3b82f6" />
          <StatCard icon={AlertTriangle} label="Pending"          value={(stats?.todoTasks || 0) + (stats?.reviewTasks || 0)} sub="Awaiting action"                         accentColor="#f59e0b" iconBg="rgba(245,158,11,0.1)"  iconColor="#f59e0b" />
          <StatCard icon={Clock}        label="Avg Completion"    value={stats?.avgCompletionTime || "—"}                     sub="Per completed task"                      accentColor="#8b5cf6" iconBg="rgba(139,92,246,0.1)"  iconColor="#8b5cf6" />
          <StatCard icon={LayoutGrid}   label="Active Workflows"  value={stats?.activeWorkflows || 0}                         sub="Running workflows"                       accentColor="#f43f5e" iconBg="rgba(244,63,94,0.1)"   iconColor="#f43f5e" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl p-5"
        style={{ background: "rgba(255,255,255,0.85)", border: "1.5px solid rgba(99,102,241,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", backdropFilter: "blur(10px)" }}>
        <h2 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(action => (
            <button key={action.label} onClick={action.onClick}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-200"
              style={{ background: "rgba(248,248,255,0.8)", border: "1.5px solid rgba(99,102,241,0.08)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,102,241,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.08)"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div className="p-3 rounded-xl text-white" style={{ background: action.gradient, boxShadow: `0 4px 12px ${action.shadow}` }}>
                <action.icon size={20} />
              </div>
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Workflows */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Recent Workflows</h2>
            <button onClick={() => navigate("/workflows")}
              className="text-sm font-medium flex items-center gap-1 transition-colors"
              style={{ color: "#6366f1" }}
              onMouseEnter={e => e.currentTarget.style.color = "#4f46e5"}
              onMouseLeave={e => e.currentTarget.style.color = "#6366f1"}>
              View All <ArrowRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentWorkflows.map(workflow => (
              <WorkflowCard key={workflow.id} workflow={workflow} onClick={() => navigate(`/workflows/${workflow.id}`)} />
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Team Activity */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.9)", border: "1.5px solid rgba(99,102,241,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(99,102,241,0.07)" }}>
              <h3 className="font-bold text-gray-900 text-sm">Team Activity</h3>
              <button onClick={() => navigate("/team")}
                className="text-xs font-semibold transition-colors"
                style={{ color: "#6366f1" }}
                onMouseEnter={e => e.currentTarget.style.color = "#4f46e5"}
                onMouseLeave={e => e.currentTarget.style.color = "#6366f1"}>
                View All
              </button>
            </div>
            <div>
              {teamMembers.slice(0, 5).map((member, i) => (
                <div key={member.id}
                  className="px-5 py-3 flex items-center justify-between transition-all"
                  style={{ borderBottom: i < Math.min(teamMembers.length, 5) - 1 ? "1px solid rgba(99,102,241,0.05)" : "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: "#6366f1" }}>{member.tasks}</p>
                    <p className="text-xs text-gray-400">tasks</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div style={{ borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1.5px solid rgba(99,102,241,0.08)" }}>
            <ActivityFeed activities={activities} maxItems={5} />
          </div>
        </div>
      </div>

      {/* New Workflow Modal */}
      <Modal isOpen={showNewWorkflow} onClose={() => { setShowNewWorkflow(false); setNewWfName(""); }} title="Create New Workflow" size="sm">
        <form onSubmit={handleCreateWorkflow} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Workflow Name *</label>
            <input
              id="new-workflow-name" name="workflow_name"
              type="text" required autoFocus
              value={newWfName}
              onChange={e => setNewWfName(e.target.value)}
              placeholder="e.g. Q4 Marketing Campaign"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowNewWorkflow(false); setNewWfName(""); }}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={creatingWf || !newWfName.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium disabled:opacity-60 flex items-center gap-2 transition-colors">
              {creatingWf ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {creatingWf ? "Creating…" : "Create Workflow"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}