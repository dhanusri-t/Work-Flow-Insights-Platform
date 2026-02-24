import { useState } from "react";
import Avatar from "./Avatar";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";

const defaultActivities = [
  {
    id: 1,
    user: { name: "Sarah Chen", avatar: null },
    action: "completed",
    target: "Employee Onboarding",
    targetType: "workflow",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
  },
  {
    id: 2,
    user: { name: "Mike Johnson", avatar: null },
    action: "commented on",
    target: "Invoice Processing",
    targetType: "task",
    comment: "Please review the attached documents before approval.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
  },
  {
    id: 3,
    user: { name: "Emily Davis", avatar: null },
    action: "created",
    target: "Q4 Planning",
    targetType: "workflow",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: 4,
    user: { name: "Alex Kim", avatar: null },
    action: "moved",
    target: "Client Meeting Notes",
    targetType: "task",
    from: "In Progress",
    to: "In Review",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
  },
];

export default function ActivityFeed({ 
  activities = defaultActivities, 
  maxItems = 10,
  className = "" 
}) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState("all");

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "completed": return "✅";
      case "commented on": return "💬";
      case "created": return "➕";
      case "moved": return "➡️";
      case "updated": return "✏️";
      case "deleted": return "🗑️";
      default: return "📋";
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "completed": return "text-emerald-600";
      case "commented on": return "text-blue-600";
      case "created": return "text-indigo-600";
      case "deleted": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const filteredActivities = activities.slice(0, expanded ? activities.length : maxItems);

  return (
    <div className={`bg-white rounded-xl border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Activity</h3>
        <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          View All
        </button>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-50">
        {filteredActivities.map((activity) => (
          <div 
            key={activity.id}
            className="px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex gap-3">
              <Avatar name={activity.user.name} size="sm" />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{activity.user.name}</span>{" "}
                  <span className={getActionColor(activity.action)}>{activity.action}</span>{" "}
                  <span className="font-medium text-gray-900">{activity.target}</span>
                </p>
                
                {activity.comment && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 italic">
                    "{activity.comment}"
                  </div>
                )}
                
                {activity.from && activity.to && (
                  <div className="mt-1 text-sm text-gray-500">
                    from <span className="font-medium">{activity.from}</span> to <span className="font-medium">{activity.to}</span>
                  </div>
                )}
                
                <p className="mt-1 text-xs text-gray-400">
                  {formatTime(activity.timestamp)}
                </p>
              </div>

              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Show More */}
      {activities.length > maxItems && (
        <div className="px-5 py-3 border-t border-gray-100">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center justify-center gap-1"
          >
            {expanded ? (
              <>Show Less <ChevronUp size={16} /></>
            ) : (
              <>Show {activities.length - maxItems} more <ChevronDown size={16} /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
