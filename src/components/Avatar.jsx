import { User } from "lucide-react";

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
  xl: "w-16 h-16 text-xl",
};

const statusDotSize = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-4 h-4",
};

export default function Avatar({ 
  src, 
  alt = "", 
  name = "", 
  size = "md", 
  status = null,
  className = "" 
}) {
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const dotSize = statusDotSize[size] || statusDotSize.md;

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Generate color from name
  const getColor = (name) => {
    if (!name) return "bg-gray-500";
    const colors = [
      "bg-indigo-500",
      "bg-blue-500",
      "bg-emerald-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-purple-500",
      "bg-cyan-500",
      "bg-orange-500",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const statusColors = {
    online: "bg-emerald-500",
    away: "bg-amber-500",
    busy: "bg-red-500",
    offline: "bg-gray-400",
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-sm`}
        />
      ) : (
        <div 
          className={`${sizeClass} ${getColor(name)} rounded-full flex items-center justify-center text-white font-semibold shadow-sm`}
        >
          {name ? getInitials(name) : <User className="w-1/2 h-1/2" />}
        </div>
      )}
      
      {status && (
        <span 
          className={`absolute bottom-0 right-0 ${dotSize} ${statusColors[status]} rounded-full border-2 border-white`}
        />
      )}
    </div>
  );
}

// Avatar Group Component
export function AvatarGroup({ 
  avatars = [], 
  max = 4, 
  size = "md",
  className = "" 
}) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  const overlapClass = {
    xs: "-ml-2",
    sm: "-ml-2",
    md: "-ml-3",
    lg: "-ml-4",
    xl: "-ml-5",
  };

  return (
    <div className={`flex items-center ${className}`}>
      {visible.map((avatar, index) => (
        <div 
          key={index} 
          className={`relative ${index > 0 ? overlapClass[size] : ""}`}
          style={{ zIndex: visible.length - index }}
        >
          <Avatar {...avatar} size={size} />
        </div>
      ))}
      
      {remaining > 0 && (
        <div 
          className={`${overlapClass[size]} w-${sizeClasses[size].replace("w-", "").replace(" h-", " h-")} h-${sizeClasses[size].replace("w-", "").replace(" h-", " h-")} bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
