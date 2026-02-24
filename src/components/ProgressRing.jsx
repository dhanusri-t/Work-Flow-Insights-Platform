export default function ProgressRing({
  progress = 0,
  size = 64,
  strokeWidth = 6,
  color = "#6366f1",
  bgColor = "#e5e7eb",
  showPercentage = true,
  className = "",
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (progress >= 100) return "#10b981"; // green
    if (progress >= 75) return color;
    if (progress >= 50) return "#f59e0b"; // amber
    if (progress >= 25) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {showPercentage && (
        <span className="absolute text-xs font-semibold text-gray-700">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
}

// Circular Stat Component
export function CircularStat({ 
  value, 
  label, 
  size = 80, 
  color = "#6366f1",
  className = "" 
}) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <ProgressRing 
        progress={value} 
        size={size} 
        color={color}
        strokeWidth={8}
        showPercentage={true}
      />
      <span className="mt-2 text-sm text-gray-600 font-medium">{label}</span>
    </div>
  );
}
