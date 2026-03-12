import { useState } from "react";
import { Plus, GripVertical, MoreHorizontal, Pencil, Trash2, ArrowRight } from "lucide-react";
import { Dropdown } from "./Dropdown";
import Avatar from "./Avatar";

const defaultColumns = [
  { id: "todo",        title: "To Do",       color: "bg-gray-500"    },
  { id: "in_progress", title: "In Progress",  color: "bg-blue-500"    },
  { id: "review",      title: "In Review",    color: "bg-amber-500"   },
  { id: "done",        title: "Done",         color: "bg-emerald-500" },
];

const STATUS_ORDER = ["todo", "in_progress", "review", "done"];

export default function KanbanBoard({
  columns = defaultColumns,
  tasks = [],
  onTaskMove,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onAddTask,
  className = "",
}) {
  const [draggedTask, setDraggedTask]     = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const getTasksByColumn = (columnId) => tasks.filter((t) => t.status === columnId);

  // ── Drag ─────────────────────────────────────────────────────────────────
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver  = (e, columnId) => { e.preventDefault(); setDragOverColumn(columnId); };
  const handleDragLeave = () => setDragOverColumn(null);
  const handleDrop = (e, columnId) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== columnId) {
      onTaskMove?.(draggedTask.id, columnId);   // ← hits the API
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  // ── Next stage helper ─────────────────────────────────────────────────────
  const getNext = (status) => {
    const idx = STATUS_ORDER.indexOf(status);
    return idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;
  };
  const getNextTitle = (status) => {
    const next = getNext(status);
    return next ? (defaultColumns.find((c) => c.id === next)?.title ?? next) : null;
  };

  // ── Priority badge ────────────────────────────────────────────────────────
  const priorityBadge = (p) => ({
    high:   { label: "High",   bg: "rgba(239,68,68,0.1)",  color: "#dc2626", border: "rgba(239,68,68,0.25)"  },
    medium: { label: "Medium", bg: "rgba(245,158,11,0.1)", color: "#d97706", border: "rgba(245,158,11,0.25)" },
    low:    { label: "Low",    bg: "rgba(34,197,94,0.1)",  color: "#16a34a", border: "rgba(34,197,94,0.25)"  },
  }[p] || null);

  return (
    <div className={`flex gap-4 overflow-x-auto pb-4 ${className}`}>
      {columns.map((column) => {
        const colTasks = getTasksByColumn(column.id);
        const isOver   = dragOverColumn === column.id;

        return (
          <div
            key={column.id}
            className={`flex-shrink-0 w-72 bg-gray-50 rounded-xl p-3 transition-all duration-200
              ${isOver ? "bg-indigo-50 ring-2 ring-indigo-200" : ""}`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
                <h3 className="font-semibold text-gray-800 text-sm">{column.title}</h3>
                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full font-medium">
                  {colTasks.length}
                </span>
              </div>
              <button
                onClick={() => onAddTask?.(column.id)}
                className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-indigo-600 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-[200px]">
              {colTasks.map((task) => {
                const badge     = priorityBadge(task.priority);
                const nextSt    = getNext(task.status);
                const nextTitle = getNextTitle(task.status);

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100
                      hover:shadow-md hover:border-indigo-200 transition-all duration-200 group
                      ${draggedTask?.id === task.id ? "opacity-40 scale-95" : ""}`}
                  >
                    {/* Row 1: priority + avatar + menu */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <GripVertical
                          size={14}
                          className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
                        />
                        {badge && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold"
                            style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                          >
                            <span className="w-1.5 h-1.5 rounded-sm" style={{ background: badge.color }} />
                            {badge.label}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {task.assignee && <Avatar name={task.assignee.name} size="sm" />}

                        <Dropdown
                          trigger={
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-600
                                opacity-0 group-hover:opacity-100 transition-all ml-1"
                            >
                              <MoreHorizontal size={15} />
                            </button>
                          }
                          items={[
                            {
                              label: "View Details",
                              onClick: (e) => { e?.stopPropagation(); onTaskClick?.(task); },
                            },
                            {
                              label: "Edit Task",
                              icon: <Pencil size={14} />,
                              onClick: (e) => { e?.stopPropagation(); onTaskEdit?.(task); },
                            },
                            ...(nextSt ? [{
                              label: `Move to ${nextTitle}`,
                              icon: <ArrowRight size={14} />,
                              onClick: (e) => { e?.stopPropagation(); onTaskMove?.(task.id, nextSt); },
                            }] : []),
                            { divider: true },
                            {
                              label: "Delete Task",
                              danger: true,
                              icon: <Trash2 size={14} />,
                              onClick: (e) => { e?.stopPropagation(); onTaskDelete?.(task); },
                            },
                          ]}
                        />
                      </div>
                    </div>

                    {/* Title */}
                    <h4
                      className="text-sm font-medium text-gray-800 mb-2 line-clamp-2 cursor-pointer hover:text-indigo-600 transition-colors"
                      onClick={() => onTaskClick?.(task)}
                    >
                      {task.title}
                    </h4>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      {task.workflow_name && (
                        <span className="truncate max-w-[130px]">{task.workflow_name}</span>
                      )}
                      {task.comments > 0 && (
                        <span className="flex items-center gap-1 ml-auto">💬 {task.comments}</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add task ghost button */}
              <button
                onClick={() => onAddTask?.(column.id)}
                className="w-full p-2 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 text-sm
                  hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all
                  flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Task
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}