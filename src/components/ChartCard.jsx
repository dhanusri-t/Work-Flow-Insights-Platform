export default function ChartCard({ title, value, variant }) {
  const colors = {
    danger: "text-red-600",
    normal: "text-gray-800",
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="text-sm text-gray-500">{title}</div>
      <div
        className={`text-xl font-semibold ${
          colors[variant] || colors.normal
        }`}
      >
        {value}
      </div>
    </div>
  );
}