import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Bell, 
  Search, 
  Plus, 
  Settings, 
  User, 
  LogOut, 
  HelpCircle,
  ChevronDown,
  Check,
  Menu,
  X
} from "lucide-react";
import { Dropdown } from "./Dropdown";
import SearchBar from "./SearchBar";
import Avatar from "./Avatar";
import Modal from "./Modal";

export default function Navbar({ onMenuClick, showMenuButton = true }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const user = JSON.parse(localStorage.getItem("user")) || { name: "Admin", email: "admin@flowcraft.com" };

  const notifications = [
    { id: 1, title: "Workflow Completed", message: "Employee Onboarding workflow has been completed", time: "2m ago", unread: true },
    { id: 2, title: "Task Assigned", message: "You have been assigned to Review Documents", time: "1h ago", unread: true },
    { id: 3, title: "Comment Added", message: "Sarah commented on Invoice Processing", time: "3h ago", unread: false },
    { id: 4, title: "Deadline Reminder", message: "Q4 Planning is due tomorrow", time: "5h ago", unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const quickCreateItems = [
    { label: "New Workflow", icon: "📋", onClick: () => {} },
    { label: "New Task", icon: "✅", onClick: () => {} },
    { label: "New Team Member", icon: "👤", onClick: () => {} },
  ];

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <Menu size={20} />
            </button>
          )}

          {/* Search Bar - Desktop */}
          <div className="hidden md:block w-80">
            <SearchBar 
              placeholder="Search workflows, tasks..." 
              onSearch={(query) => console.log("Searching:", query)}
            />
          </div>

          {/* Search Button - Mobile */}
          <button
            onClick={() => setShowSearch(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <Search size={20} />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Quick Create Button */}
          <Dropdown
            trigger={
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors">
                <Plus size={18} />
                <span className="hidden lg:inline">Create</span>
              </button>
            }
            items={quickCreateItems.map(item => ({
              label: item.label,
              icon: <span>{item.icon}</span>,
              onClick: item.onClick,
            }))}
          />

          {/* Mobile Create Button */}
          <button
            onClick={() => setShowQuickCreate(true)}
            className="sm:hidden p-2 rounded-lg bg-indigo-600 text-white"
          >
            <Plus size={20} />
          </button>

          {/* Notifications */}
          <Dropdown
            trigger={
              <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            }
            align="right"
            width="w-80"
            items={[
              { 
                label: (
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="font-semibold text-gray-900">Notifications</span>
                    <button className="text-xs text-indigo-600 font-medium">Mark all read</button>
                  </div>
                ),
                keepOpen: true,
              },
              ...notifications.map(notif => ({
                label: (
                  <div className={`py-2 ${notif.unread ? "bg-indigo-50/50 -mx-2 px-2 rounded" : ""}`}>
                    <p className="font-medium text-gray-900 text-sm">{notif.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{notif.message}</p>
                    <p className="text-gray-400 text-xs mt-1">{notif.time}</p>
                  </div>
                ),
                keepOpen: true,
              })),
              { divider: true },
              { label: "View all notifications", onClick: () => {} },
            ]}
          />

          {/* User Menu */}
          <Dropdown
            trigger={
              <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <Avatar name={user.name} size="sm" />
                <ChevronDown size={16} className="text-gray-400 hidden sm:block" />
              </button>
            }
            align="right"
            width="w-56"
            items={[
              { 
                label: (
                  <div className="py-2">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                ),
                keepOpen: true,
              },
              { divider: true },
              { label: "Profile Settings", icon: <User size={16} />, onClick: () => {} },
              { label: "Team Settings", icon: <Settings size={16} />, onClick: () => {} },
              { label: "Help & Support", icon: <HelpCircle size={16} />, onClick: () => {} },
              { divider: true },
              { label: "Sign Out", icon: <LogOut size={16} />, danger: true, onClick: () => {
                localStorage.clear();
                window.location.href = "/login";
              }},
            ]}
          />
        </div>
      </header>

      {/* Mobile Search Modal */}
      <Modal 
        isOpen={showSearch} 
        onClose={() => setShowSearch(false)} 
        title="Search"
        size="full"
      >
        <div className="p-4">
          <SearchBar 
            placeholder="Search workflows, tasks..." 
            onSearch={(query) => {
              console.log("Searching:", query);
              setShowSearch(false);
            }}
          />
        </div>
      </Modal>

      {/* Mobile Quick Create Modal */}
      <Modal
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        title="Quick Create"
        size="sm"
      >
        <div className="space-y-2">
          {quickCreateItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setShowQuickCreate(false);
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 text-left transition-colors"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="font-medium text-gray-900">{item.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
