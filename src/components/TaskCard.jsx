import StatusBadge from "./StatusBadge";

export default function TaskCard({ task }) {
  return (
    <div className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50">
      <div>
        <div className="font-medium text-gray-800">{task.title}</div>
        <div className="text-xs text-gray-500 mt-1">
          Duration: {task.duration}
        </div>
      </div>

      <StatusBadge status={task.status} />
    </div>
  );
}