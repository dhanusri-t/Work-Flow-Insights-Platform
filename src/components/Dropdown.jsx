import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export function Dropdown({ 
  trigger, 
  items, 
  align = "right", 
  width = "w-48",
  className = "" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const alignClass = align === "left" ? "left-0" : "right-0";

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      
      {isOpen && (
        <div 
          className={`absolute ${alignClass} mt-2 ${width} bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-fadeIn`}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={index} className="my-1 border-t border-gray-100" />;
            }
            
            return (
              <button
                key={index}
                onClick={() => {
                  item.onClick?.();
                  if (!item.keepOpen) setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left
                  transition-colors duration-150
                  ${item.disabled 
                    ? "text-gray-400 cursor-not-allowed" 
                    : item.danger 
                      ? "text-red-600 hover:bg-red-50" 
                      : "text-gray-700 hover:bg-gray-50"
                  }
                  ${item.icon ? "has-icon" : ""}
                `}
                disabled={item.disabled}
              >
                {item.icon && <span className="text-gray-400">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
                {item.checked && <Check size={16} className="text-indigo-600" />}
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-600 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DropdownMenu({ children, ...props }) {
  return <Dropdown {...props}>{children}</Dropdown>;
}
