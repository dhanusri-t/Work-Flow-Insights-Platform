import { useState } from "react";
import { MoreHorizontal, Plus, GripVertical } from "lucide-react";
import { Dropdown } from "./Dropdown";

const defaultColumns = [
  { id: "todo", title: "To Do", color: "bg-gray-500" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-500" },
  { id: "review", title: "In Review", color: "bg-amber-500" },
  { id: "done", title: "Done", color: "bg-emerald-500" },
];

export default function KanbanBoard({ 
  columns = defaultColumns, 
  tasks = [], 
  onTaskMove,
  onTaskClick,
  onAddTask,
  className = "" 
}) {
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const getTasksByColumn = (columnId) => {
    return tasks.filter(task => task.status === columnId);
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    // Create custom drag image
    const ghost = e.target.cloneNode(true);
    ghost.style.opacity = "0.8";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== columnId) {
      onTaskMove?.(draggedTask.id, columnId);
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-amber-500";
      case "low": return "bg-blue-500";
      default: return "bg-gray-400";
    }
  };

  return (
    <div className={`flex gap-4 overflow-x-auto pb-4 ${className}`}>
      {columns.map((column) => {
        const columnTasks = getTasksByColumn(column.id);
        
        return (
          <div 
            key={column.id}
            className={`
              flex-shrink-0 w-72 bg-gray-50 rounded-xl p-3
              transition-all duration-200
              ${dragOverColumn === column.id ? "bg-indigo-50 ring-2 ring-indigo-200" : ""}
            `}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
                <h3 className="font-semibold text-gray-800 text-sm">
                  {column.title}
                </h3>
                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full font-medium">
                  {columnTasks.length}
                </span>
              </div>
              
              <Dropdown
                trigger={
                  <button className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
                    <MoreHorizontal size={16} />
                  </button>
                }
                items={[
                  { label: "Add Task", icon: <Plus size={16} />, onClick: () => onAddTask?.(column.id) },
                  { divider: true },
                  { label: "Rename", onClick: () => {} },
                  { label: "Delete", danger: true, onClick: () => {} },
                ]}
              />
            </div>

            {/* Tasks */}
            <div className="space-y-2 min-h-[200px]">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onClick={() => onTaskClick?.(task)}
                  className={`
                    bg-white rounded-lg p-3 shadow-sm border border-gray-100
                    cursor-pointer hover:shadow-md hover:border-indigo-200
                    transition-all duration-200 group
                    ${draggedTask?.id === task.id ? "opacity-50" : ""}
                  `}
                >
                  {/* Priority & Actions */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GripVertical size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                      {task.priority && (
                        <span className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(task.priority)}`} />
                      )}
                    </div>
                    {task.assignee && (
                      <img 
                        src={task.assignee.avatar} 
                        alt={task.assignee.name}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-medium text-gray-800 mb-2 line-clamp-2">
                    {task.title}
                  </h4>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    {task.dueDate && (
                      <span className={`
                        ${new Date(task.dueDate) < new Date() ? "text-red-500" : ""}
                      `}>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      {task.comments && (
                        <span className="flex items-center gap-1">
                          💬 {task.comments}
                        </span>
                      )}
                      {task.attachments && (
                        <span className="flex items-center gap-1">
                          📎 {task.attachments}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Task Button */}
              <button
                onClick={() => onAddTask?.(column.id)}
                className="w-full p-2 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 text-sm hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Task
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
