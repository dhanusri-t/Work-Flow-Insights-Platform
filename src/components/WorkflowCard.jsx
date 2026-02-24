import { MoreHorizontal, Calendar, Users, CheckCircle, Clock } from "lucide-react";
import { Dropdown } from "./Dropdown";
import Avatar, { AvatarGroup } from "./Avatar";

export default function WorkflowCard({ 
  workflow, 
  onClick,
  variant = "default", // "default" | "compact" | "featured"
  className = "" 
}) {
  const { 
    title, 
    description, 
    status, 
    progress, 
    dueDate, 
    assignee,
    priority,
    taskCount = { completed: 0, total: 0 },
    category,
  } = workflow;

  const statusConfig = {
    active: { label: "Active", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
    completed: { label: "Completed", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
    delayed: { label: "Delayed", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
    draft: { label: "Draft", color: "bg-gray-100 text-gray-700", dot: "bg-gray-400" },
    on_hold: { label: "On Hold", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  };

  const priorityConfig = {
    high: { label: "High", color: "text-red-500", icon: "🔴" },
    medium: { label: "Medium", color: "text-amber-500", icon: "🟡" },
    low: { label: "Low", color: "text-blue-500", icon: "🔵" },
  };

  const currentStatus = statusConfig[status] || statusConfig.draft;
  const currentPriority = priority ? priorityConfig[priority] : null;

  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diff = d - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { text: "Overdue", color: "text-red-500" };
    if (days === 0) return { text: "Today", color: "text-amber-500" };
    if (days === 1) return { text: "Tomorrow", color: "text-amber-500" };
    if (days <= 7) return { text: `${days} days left`, color: "text-gray-500" };
    return { text: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), color: "text-gray-500" };
  };

  const dateInfo = formatDate(dueDate);

  if (variant === "compact") {
    return (
      <div 
        onClick={onClick}
        className={`bg-white rounded-lg border border-gray-100 p-4 hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all ${className}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {currentPriority && <span>{currentPriority.icon}</span>}
              <h4 className="font-medium text-gray-900 truncate">{title}</h4>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className={`flex items-center gap-1 ${currentStatus.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`} />
                {currentStatus.label}
              </span>
              {taskCount.total > 0 && (
                <span className="flex items-center gap-1">
                  <CheckCircle size={14} />
                  {taskCount.completed}/{taskCount.total}
                </span>
              )}
            </div>
          </div>
          <Dropdown
            trigger={
              <button 
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded hover:bg-gray-100 text-gray-400"
              >
                <MoreHorizontal size={16} />
              </button>
            }
            items={[
              { label: "View Details", onClick: onClick },
              { label: "Edit", onClick: () => {} },
              { label: "Duplicate", onClick: () => {} },
              { divider: true },
              { label: "Delete", danger: true, onClick: () => {} },
            ]}
          />
        </div>
        
        {/* Progress */}
        {taskCount.total > 0 && (
          <div className="mt-3">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${(taskCount.completed / taskCount.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-100 hover:shadow-lg hover:border-indigo-200 cursor-pointer transition-all group ${className}`}
    >
      {/* Header */}
      <div className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {category && (
              <span className="inline-block px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-600 rounded mb-2">
                {category}
              </span>
            )}
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
            )}
          </div>
          
          <Dropdown
            trigger={
              <button 
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreHorizontal size={18} />
              </button>
            }
            items={[
              { label: "View Details", onClick: onClick },
              { label: "Edit Workflow", onClick: () => {} },
              { label: "Duplicate", onClick: () => {} },
              { label: "Archive", onClick: () => {} },
              { divider: true },
              { label: "Delete", danger: true, onClick: () => {} },
            ]}
          />
        </div>
      </div>

      {/* Status & Priority */}
      <div className="px-5 py-3 flex items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${currentStatus.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`} />
          {currentStatus.label}
        </span>
        {currentPriority && (
          <span className={`text-xs font-medium ${currentPriority.color}`}>
            {currentPriority.icon} {currentPriority.label}
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="px-5">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-500">Progress</span>
          <span className="font-medium text-gray-900">
            {taskCount.completed}/{taskCount.total} tasks
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${(taskCount.completed / taskCount.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-50 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {dateInfo && (
              <div className={`flex items-center gap-1.5 text-sm ${dateInfo.color}`}>
                <Calendar size={14} />
                {dateInfo.text}
              </div>
            )}
            {taskCount.total > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <CheckCircle size={14} />
                {Math.round((taskCount.completed / taskCount.total) * 100)}%
              </div>
            )}
          </div>
          
          {assignee && Array.isArray(assignee) ? (
            <AvatarGroup 
              avatars={assignee.map(a => ({ name: a.name, src: a.avatar }))} 
              max={3}
              size="sm"
            />
          ) : assignee ? (
            <Avatar name={assignee.name} src={assignee.avatar} size="sm" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
