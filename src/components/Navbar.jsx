import { useState } from "react";
import {
  Bell,
  Search,
  Plus,
  Settings,
  User,
  LogOut,
  HelpCircle,
  ChevronDown,
  Menu,
} from "lucide-react";

import { Dropdown } from "./Dropdown";
import SearchBar from "./SearchBar";
import Avatar from "./Avatar";
import Modal from "./Modal";

export default function Navbar({ onMenuClick, showMenuButton = true }) {
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const user =
    JSON.parse(localStorage.getItem("user")) || {
      name: "Admin",
      email: "admin@flowcraft.com",
    };

  const notifications = [
    { id: 1, unread: true },
    { id: 2, unread: true },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  const quickCreateItems = [
    { label: "New Workflow", icon: "📋", onClick: () => {} },
    { label: "New Task", icon: "✅", onClick: () => {} },
    { label: "New Team Member", icon: "👤", onClick: () => {} },
  ];

  return (
    <>
      <header
        className="h-16 flex items-center justify-between px-5 lg:px-8 sticky top-0 z-30"
        style={{
          background: "linear-gradient(135deg, rgba(224,231,255,0.95) 0%, rgba(199,210,254,0.9) 50%, rgba(224,231,255,0.95) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(99,102,241,0.18)",
          boxShadow: "0 1px 0 rgba(99,102,241,0.1), 0 4px 24px rgba(99,102,241,0.12)",
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-xl text-gray-500 transition-all duration-150"
              style={{ boxShadow: "0 0 0 0 transparent" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Menu size={20} />
            </button>
          )}

          <div className="hidden md:block w-96">
            <div
              style={{
                borderRadius: "14px",
                background: "rgba(255,255,255,0.75)",
                border: "1.5px solid rgba(99,102,241,0.2)",
                boxShadow: "0 2px 8px rgba(99,102,241,0.08), inset 0 1px 2px rgba(255,255,255,0.9)",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onFocusCapture={e => {
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.08), 0 2px 8px rgba(99,102,241,0.1)";
              }}
              onBlurCapture={e => {
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.12)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(99,102,241,0.06), inset 0 1px 2px rgba(255,255,255,0.8)";
              }}
            >
              <SearchBar placeholder="Search workflows, tasks..." />
            </div>
          </div>

          <button
            onClick={() => setShowSearch(true)}
            className="md:hidden p-2 rounded-xl text-gray-500 transition-all"
            style={{ background: "rgba(248,248,255,0.9)", border: "1.5px solid rgba(99,102,241,0.12)" }}
          >
            <Search size={20} />
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Create button */}
          <Dropdown
            trigger={
              <button
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-white rounded-xl font-semibold text-sm transition-all duration-150"
                style={{
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  boxShadow: "0 2px 12px rgba(99,102,241,0.35), 0 1px 3px rgba(99,102,241,0.2)",
                  border: "1px solid rgba(99,102,241,0.3)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.45), 0 2px 6px rgba(99,102,241,0.3)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(99,102,241,0.35), 0 1px 3px rgba(99,102,241,0.2)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Plus size={17} />
                <span className="hidden lg:inline">Create</span>
              </button>
            }
            items={quickCreateItems.map((item) => ({
              label: item.label,
              icon: <span>{item.icon}</span>,
              onClick: item.onClick,
            }))}
          />

          <button
            onClick={() => setShowQuickCreate(true)}
            className="sm:hidden p-2 rounded-xl text-white"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
            }}
          >
            <Plus size={20} />
          </button>

          {/* Bell */}
          <button
            className="relative p-2.5 rounded-xl text-gray-500 transition-all duration-150"
            style={{
              background: "rgba(255,255,255,0.7)",
              border: "1.5px solid rgba(99,102,241,0.18)",
              boxShadow: "0 1px 4px rgba(99,102,241,0.08)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(99,102,241,0.06)";
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(248,248,255,0.9)";
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.1)";
            }}
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-4 h-4 text-white text-xs rounded-full flex items-center justify-center font-bold"
                style={{
                  background: "linear-gradient(135deg, #f43f5e, #e11d48)",
                  boxShadow: "0 1px 4px rgba(244,63,94,0.5)",
                  fontSize: "10px",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Avatar dropdown */}
          <Dropdown
            trigger={
              <button
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all duration-150"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  border: "1.5px solid rgba(99,102,241,0.18)",
                  boxShadow: "0 1px 4px rgba(99,102,241,0.08)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(99,102,241,0.06)";
                  e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(248,248,255,0.9)";
                  e.currentTarget.style.borderColor = "rgba(99,102,241,0.1)";
                }}
              >
                <Avatar name={user.name} size="sm" />
                <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
              </button>
            }
            align="right"
            width="w-56"
            items={[
              {
                label: (
                  <div className="py-2">
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                ),
                keepOpen: true,
              },
              { divider: true },
              { label: "Profile Settings", icon: <User size={16} /> },
              { label: "Team Settings", icon: <Settings size={16} /> },
              { label: "Help & Support", icon: <HelpCircle size={16} /> },
              { divider: true },
              {
                label: "Sign Out",
                icon: <LogOut size={16} />,
                danger: true,
                onClick: () => {
                  localStorage.clear();
                  window.location.href = "/login";
                },
              },
            ]}
          />
        </div>
      </header>

      <Modal isOpen={showSearch} onClose={() => setShowSearch(false)} title="Search" size="full">
        <div className="p-4">
          <SearchBar placeholder="Search workflows, tasks..." />
        </div>
      </Modal>

      <Modal isOpen={showQuickCreate} onClose={() => setShowQuickCreate(false)} title="Quick Create" size="sm">
        <div className="space-y-2">
          {quickCreateItems.map((item, index) => (
            <button
              key={index}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-indigo-50 text-left transition-all"
              style={{ border: "1.5px solid transparent" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}
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