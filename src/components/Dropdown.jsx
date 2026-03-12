import { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";

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
      {/* ✅ stopPropagation so trigger click doesn't bubble to parent card */}
      <span
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="cursor-pointer inline-block"
      >
        {trigger}
      </span>

      {isOpen && (
        <div
          className={`absolute ${alignClass} mt-2 ${width} rounded-xl py-1 z-50 animate-fadeIn`}
          style={{
            background: "linear-gradient(160deg, rgba(224,231,255,0.98) 0%, rgba(238,242,255,0.98) 100%)",
            border: "1.5px solid rgba(99,102,241,0.15)",
            boxShadow: "0 8px 32px rgba(99,102,241,0.15), 0 2px 8px rgba(99,102,241,0.08)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={index} className="my-1" style={{ borderTop: "1px solid rgba(99,102,241,0.12)" }} />;
            }

            return (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation(); // ✅ prevent click bubbling to card
                  item.onClick?.(e);
                  if (!item.keepOpen) setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-all duration-150 rounded-lg mx-auto
                  ${item.disabled
                    ? "text-gray-400 cursor-not-allowed"
                    : item.danger
                      ? "text-red-600 hover:bg-red-50"
                      : "text-gray-700"
                  }
                `}
                onMouseEnter={e => {
                  if (!item.disabled && !item.danger) {
                    e.currentTarget.style.background = "rgba(99,102,241,0.1)";
                    e.currentTarget.style.color = "#4f46e5";
                  }
                }}
                onMouseLeave={e => {
                  if (!item.disabled && !item.danger) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#374151";
                  }
                }}
                disabled={item.disabled}
              >
                {item.icon && (
                  <span style={{ color: "rgba(99,102,241,0.6)" }}>{item.icon}</span>
                )}
                <span className="flex-1">{item.label}</span>
                {item.checked && <Check size={16} className="text-indigo-600" />}
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs rounded-full"
                    style={{ background: "rgba(99,102,241,0.12)", color: "#4f46e5" }}>
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