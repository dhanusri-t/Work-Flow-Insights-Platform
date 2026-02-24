import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Plus,
  ArrowRight,
  Play,
  CheckCircle2,
  XCircle,
  Timer,
  Users
} from "lucide-react";
import StatsCard from "../components/StatsCard";
import WorkflowCard from "../components/WorkflowCard";
import WorkflowTable from "../components/WorkflowTable";
import ActivityFeed from "../components/ActivityFeed";
import Avatar from "../components/Avatar";
import { Dropdown } from "../components/Dropdown";

const stats = [
  {
    label: "Active Workflows",
    value: "12",
    icon: Activity,
    color: "indigo",
    trend: "up",
    trendValue: "+3",
  },
  {
    label: "Avg. Completion Time",
    value: "2h 14m",
    icon: Clock,
    color: "blue",
    trend: "down",
    trendValue: "-12%",
  },
  {
    label: "Delayed Tasks",
    value: "3",
    icon: AlertTriangle,
    color: "red",
  },
  {
    label: "Team Efficiency",
    value: "94%",
    icon: TrendingUp,
    color: "emerald",
    trend: "up",
    trendValue: "+8%",
  },
];

const recentWorkflows = [
  {
    id: 1,
    title: "Employee Onboarding",
    description: "Complete onboarding process for new hires",
    status: "active",
    priority: "high",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    taskCount: { completed: 6, total: 10 },
    category: "HR",
    assignee: { name: "Sarah Chen" },
  },
  {
    id: 2,
    title: "Invoice Processing",
    description: "Monthly invoice approval workflow",
    status: "active",
    priority: "medium",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
    taskCount: { completed: 4, total: 8 },
    category: "Finance",
    assignee: { name: "Mike Johnson" },
  },
  {
    id: 3,
    title: "Client Onboarding",
    description: "New client setup and welcome process",
    status: "completed",
    priority: "high",
    taskCount: { completed: 12, total: 12 },
    category: "Sales",
    assignee: { name: "Emily Davis" },
  },
  {
    id: 4,
    title: "Q4 Planning",
    description: "Quarterly planning and goal setting",
    status: "on_hold",
    priority: "medium",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    taskCount: { completed: 2, total: 15 },
    category: "Operations",
    assignee: { name: "Alex Kim" },
  },
];

const quickActions = [
  { icon: Play, label: "Start Workflow", color: "bg-emerald-500" },
  { icon: CheckCircle2, label: "Complete Task", color: "bg-blue-500" },
  { icon: Users, label: "Add Member", color: "bg-purple-500" },
  { icon: Timer, label: "Set Reminder", color: "bg-amber-500" },
];

const teamMembers = [
  { name: "Sarah Chen", role: "HR Manager", status: "online", tasks: 5 },
  { name: "Mike Johnson", role: "Finance Lead", status: "online", tasks: 3 },
  { name: "Emily Davis", role: "Sales Manager", status: "away", tasks: 7 },
  { name: "Alex Kim", role: "Operations", status: "offline", tasks: 2 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || { name: "Admin" };
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {greeting}, {user.name?.split(" ")[0] || "there"}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your workflows today.
          </p>
        </div>
        
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30">
          <Plus size={20} />
          New Workflow
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatsCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group"
            >
              <div className={`p-3 rounded-xl ${action.color} text-white group-hover:scale-110 transition-transform`}>
                <action.icon size={20} />
              </div>
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Workflows */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Workflows</h2>
            <button 
              onClick={() => navigate("/workflows")}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              View All <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentWorkflows.slice(0, 4).map((workflow) => (
              <WorkflowCard 
                key={workflow.id}
                workflow={workflow}
                onClick={() => navigate(`/workflows/${workflow.id}`)}
              />
            ))}
          </div>
        </div>

        {/* Activity & Team */}
        <div className="space-y-6">
          {/* Team Overview */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Team Activity</h3>
              <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                View All
              </button>
            </div>
            
            <div className="divide-y divide-gray-50">
              {teamMembers.map((member) => (
                <div key={member.name} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} size="sm" status={member.status} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{member.tasks}</p>
                    <p className="text-xs text-gray-500">tasks</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <ActivityFeed maxItems={5} />
        </div>
      </div>
    </div>
  );
}
