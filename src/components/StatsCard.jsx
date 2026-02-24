import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = null,
  trendValue = null,
  color = "indigo",
  className = "",
}) {
  const colors = {
    indigo: {
      bg: "bg-indigo-50",
      icon: "bg-indigo-500",
      text: "text-indigo-600",
    },
    blue: {
      bg: "bg-blue-50",
      icon: "bg-blue-500",
      text: "text-blue-600",
    },
    emerald: {
      bg: "bg-emerald-50",
      icon: "bg-emerald-500",
      text: "text-emerald-600",
    },
    amber: {
      bg: "bg-amber-50",
      icon: "bg-amber-500",
      text: "text-amber-600",
    },
    red: {
      bg: "bg-red-50",
      icon: "bg-red-500",
      text: "text-red-600",
    },
    purple: {
      bg: "bg-purple-50",
      icon: "bg-purple-500",
      text: "text-purple-600",
    },
  };

  const colorScheme = colors[color] || colors.indigo;

  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp size={14} />;
    if (trend === "down") return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-emerald-600";
    if (trend === "down") return "text-red-600";
    return "text-gray-500";
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          
          {subtitle && (
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          )}
          
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{trendValue}</span>
              <span className="text-gray-400 font-normal">vs last month</span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`p-3 rounded-xl ${colorScheme.icon}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

// Mini Stats Card for inline use
export function MiniStats({ items = [] }) {
  return (
    <div className="flex gap-4">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${item.color}`} />
          <span className="text-sm text-gray-600">{item.label}</span>
          <span className="text-sm font-semibold text-gray-900">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
