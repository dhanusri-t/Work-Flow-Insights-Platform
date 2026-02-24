import { useState } from "react";

export default function Tabs({ 
  tabs = [], 
  defaultTab = 0, 
  onChange,
  variant = "underline", // "underline" | "pills" | "bordered"
  className = "",
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabClick = (index) => {
    setActiveTab(index);
    onChange?.(index);
  };

  const variants = {
    underline: {
      container: "border-b border-gray-200",
      tab: (isActive) => 
        `pb-3 px-1 text-sm font-medium transition-all relative ${
          isActive 
            ? "text-indigo-600 border-b-2 border-indigo-600" 
            : "text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent"
        }`,
      tabList: "flex gap-6",
    },
    pills: {
      container: "",
      tab: (isActive) => 
        `px-4 py-2 text-sm font-medium rounded-lg transition-all ${
          isActive 
            ? "bg-indigo-600 text-white" 
            : "text-gray-600 hover:bg-gray-100"
        }`,
      tabList: "flex gap-2 p-1 bg-gray-100 rounded-xl",
    },
    bordered: {
      container: "border-b border-gray-200",
      tab: (isActive) => 
        `px-4 py-2.5 text-sm font-medium transition-all border-b-2 ${
          isActive 
            ? "text-indigo-600 border-indigo-600" 
            : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
        }`,
      tabList: "flex gap-4",
    },
  };

  const styles = variants[variant] || variants.underline;

  return (
    <div className={className}>
      <div className={`${styles.container}`}>
        <div className={`${styles.tabList}`}>
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => handleTabClick(index)}
              className={styles.tab(activeTab === index)}
            >
              {tab.icon && (
                <span className="mr-2 inline-flex">
                  {tab.icon}
                </span>
              )}
              {tab.label}
              {tab.badge && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-4">
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
}

// Tab Panel Wrapper
export function TabPanel({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}
