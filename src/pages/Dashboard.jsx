import { useState, useEffect } from "react";
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
  Timer,
  Users,
  Loader2,
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import WorkflowCard from "../components/WorkflowCard";
import ActivityFeed from "../components/ActivityFeed";
import Avatar from "../components/Avatar";
import { dashboardAPI, workflowsAPI } from "../api/api";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const quickActions = [
  { icon: Play, label: "Start Workflow", color: "bg-emerald-500" },
  { icon: CheckCircle2, label: "Complete Task", color: "bg-blue-500" },
  { icon: Users, label: "Add Member", color: "bg-purple-500" },
  { icon: Timer, label: "Set Reminder", color: "bg-amber-500" },
];

// Alert component
function Alert({ type, title, message, time }) {
  const styles = {
    success: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-500" },
    warning: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-500" },
    info: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-500" },
    error: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-500" },
  };
  
  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    info: Info,
    error: AlertCircle,
  };
  
  const Icon = icons[type] || Info;
  const style = styles[type] || styles.info;
  
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${style.bg} ${style.border}`}>
      <Icon size={20} className={style.icon} />
      <div className="flex-1">
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
      <span className="text-xs text-gray-400">{time}</span>
    </div>
  );
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentWorkflows, setRecentWorkflows] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  
  const user = JSON.parse(localStorage.getItem("user")) || { name: "Admin" };
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";

  // Generate alerts based on stats
  const getAlerts = () => {
    if (!stats) return [];
    const alerts = [];
    
    if (stats.delayedTasks > 0) {
      alerts.push({
        type: "warning",
        title: "Delayed Tasks",
        message: `You have ${stats.delayedTasks} task${stats.delayedTasks > 1 ? 's' : ''} that need attention`,
        time: "Now"
      });
    }
    
    if (stats.inProgressTasks > 5) {
      alerts.push({
        type: "info",
        title: "Active Work",
        message: `${stats.inProgressTasks} tasks are currently in progress`,
        time: "Now"
      });
    }
    
    if (stats.completedWorkflows > 0) {
      alerts.push({
        type: "success",
        title: "Workflow Completed",
        message: `${stats.completedWorkflows} workflow${stats.completedWorkflows > 1 ? 's' : ''} completed successfully`,
        time: "Today"
      });
    }
    
    if (stats.teamEfficiency >= 80) {
      alerts.push({
        type: "success",
        title: "Great Efficiency",
        message: `Team efficiency is at ${stats.teamEfficiency}% - keep it up!`,
        time: "Now"
      });
    }
    
    return alerts;
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, workflowsRes] = await Promise.all([
        dashboardAPI.getStats(),
        workflowsAPI.getAll()
      ]);
      
      const transformedActivities = (statsRes.data.recentActivity || []).map((activity) => ({
        id: activity.id,
        user: { name: activity.changed_by || activity.updated_by || "Unknown", avatar: null },
        action: activity.new_status === 'done' ? 'completed' : 
                activity.new_status === 'in_progress' ? 'moved' : 
                activity.new_status === 'review' ? 'moved' : 'updated',
        target: activity.task_title || activity.title || "Task",
        targetType: "task",
        from: activity.old_status,
        to: activity.new_status,
        timestamp: new Date(activity.changed_at || activity.updated_at),
      }));

      setStats(statsRes.data.stats);
      setRecentWorkflows(workflowsRes.data.slice(0, 4));
      setTeamMembers(statsRes.data.teamMembers);
      setActivities(transformedActivities);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Task Status Doughnut Chart Data
  const getTaskStatusChartData = () => ({
    labels: ['Done', 'In Progress', 'In Review', 'To Do'],
    datasets: [{
      data: [
        stats?.doneTasks || 0,
        stats?.inProgressTasks || 0,
        stats?.reviewTasks || 0,
        stats?.todoTasks || 0
      ],
      backgroundColor: [
        '#10b981',
        '#3b82f6',
        '#f59e0b',
        '#6b7280',
      ],
      borderWidth: 0,
      cutout: '70%',
    }],
  });

  // Workflow Status Bar Chart Data
  const getWorkflowChartData = () => ({
    labels: ['Active', 'Completed', 'Total'],
    datasets: [{
      label: 'Workflows',
      data: [
        stats?.activeWorkflows || 0,
        stats?.completedWorkflows || 0,
        stats?.totalWorkflows || 0
      ],
      backgroundColor: [
        '#6366f1',
        '#10b981',
        '#3b82f6',
      ],
      borderRadius: 8,
      barThickness: 40,
    }],
  });

  // Weekly Activity Line Chart Data
  const getWeeklyActivityData = () => ({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Activities',
      data: [12, 19, 8, 15, 22, 5, 3],
      fill: true,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      tension: 0.4,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
    }],
  });

  // Team Performance Bar Chart Data
  const getTeamPerformanceData = () => ({
    labels: teamMembers.slice(0, 5).map(m => m.name?.split(' ')[0] || 'Unknown'),
    datasets: [
      {
        label: 'Completed',
        data: teamMembers.slice(0, 5).map(m => m.completed || 0),
        backgroundColor: '#10b981',
        borderRadius: 4,
      },
      {
        label: 'In Progress',
        data: teamMembers.slice(0, 5).map(() => Math.floor(Math.random() * 5) + 1),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      },
    ],
  });

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

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
        
        <button 
          onClick={() => navigate("/workflows")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30"
        >
          <Plus size={20} />
          New Workflow
        </button>
      </div>

      {/* Alerts Section */}
      {getAlerts().length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications & Alerts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getAlerts().map((alert, index) => (
              <Alert key={index} {...alert} />
            ))}
          </div>
        </div>
      )}

      {/* Analytics Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Status Doughnut */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
          <div className="h-64 relative">
            <Doughnut 
              data={getTaskStatusChartData()} 
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                      padding: 20,
                      usePointStyle: true,
                    }
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Workflow Status Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Overview</h3>
          <div className="h-64">
            <Bar data={getWorkflowChartData()} options={barChartOptions} />
          </div>
        </div>

        {/* Weekly Activity Line */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity</h3>
          <div className="h-64">
            <Line data={getWeeklyActivityData()} options={lineChartOptions} />
          </div>
        </div>
      </div>

      {/* Analytics Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h3>
          <div className="h-64">
            <Bar 
              data={getTeamPerformanceData()} 
              options={{
                ...barChartOptions,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                      usePointStyle: true,
                      boxWidth: 8,
                    }
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
              <p className="text-sm text-indigo-600 font-medium">Total Tasks</p>
              <p className="text-3xl font-bold text-indigo-900 mt-1">{stats?.totalTasks || 0}</p>
              <p className="text-xs text-indigo-500 mt-1">across all workflows</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
              <p className="text-sm text-emerald-600 font-medium">Completed</p>
              <p className="text-3xl font-bold text-emerald-900 mt-1">{stats?.doneTasks || 0}</p>
              <p className="text-xs text-emerald-500 mt-1">{stats?.teamEfficiency || 0}% completion rate</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <p className="text-sm text-blue-600 font-medium">In Progress</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats?.inProgressTasks || 0}</p>
              <p className="text-xs text-blue-500 mt-1">tasks being worked on</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
              <p className="text-sm text-amber-600 font-medium">Pending</p>
              <p className="text-3xl font-bold text-amber-900 mt-1">{(stats?.todoTasks || 0) + (stats?.reviewTasks || 0)}</p>
              <p className="text-xs text-amber-500 mt-1">awaiting action</p>
            </div>
          </div>
        </div>
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
          
          {recentWorkflows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentWorkflows.map((workflow) => (
                <WorkflowCard 
                  key={workflow.id}
                  workflow={workflow}
                  onClick={() => navigate(`/workflows/${workflow.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-500">No workflows found. Create your first workflow!</p>
              <button 
                onClick={() => navigate("/workflows")}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
              >
                Create Workflow
              </button>
            </div>
          )}
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
              {teamMembers.length > 0 ? (
                teamMembers.slice(0, 5).map((member) => (
                  <div key={member.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.name} size="sm" status="online" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{member.tasks || 0}</p>
                      <p className="text-xs text-gray-500">tasks</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-4 text-center text-gray-500 text-sm">
                  No team members found
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <ActivityFeed activities={activities} maxItems={5} />
        </div>
      </div>
    </div>
  );
}
