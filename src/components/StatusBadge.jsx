export default function StatusBadge({ status }) {
  const styles = {
    Active: "bg-green-100 text-green-700",
    Delayed: "bg-red-100 text-red-700",
    Completed: "bg-blue-100 text-blue-700",
    "In Progress": "bg-yellow-100 text-yellow-700",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        styles[status]
      }`}
    >
      {status}
    </span>
  );
}