import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Search, Plus, Settings, User, LogOut,
  HelpCircle, ChevronDown, Menu, X,
  LayoutGrid, CheckSquare, UserPlus, Clock,
  CheckCircle2, AlertTriangle, Info,
} from "lucide-react";

import { Dropdown } from "./Dropdown";
import SearchBar from "./SearchBar";
import Avatar from "./Avatar";
import Modal from "./Modal";

const NOTIFICATIONS = [
  { id: 1, type: "success", icon: CheckCircle2, color: "#10b981", bg: "#d1fae5", title: "Workflow completed", message: "\"Q4 Planning\" has been completed", time: "2m ago", unread: true },
  { id: 2, type: "warning", icon: AlertTriangle, color: "#f59e0b", bg: "#fef3c7", title: "Task overdue", message: "\"Design review\" is past due date", time: "1h ago", unread: true },
  { id: 3, type: "info",    icon: Info,          color: "#6366f1", bg: "#e0e7ff", title: "New member joined", message: "Sarah Chen joined Engineering", time: "3h ago", unread: false },
];

export default function Navbar({ onMenuClick, showMenuButton = true }) {
  const navigate = useNavigate();
  const [showSearch, setShowSearch]       = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const user = JSON.parse(localStorage.getItem("user")) || { name: "Admin", email: "admin@flowcraft.com" };
  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => setNotifications(p => p.map(n => ({ ...n, unread: false })));
  const dismissNotif = (id) => setNotifications(p => p.filter(n => n.id !== id));

  const quickCreateItems = [
    { label: "New Workflow",    icon: <LayoutGrid size={16} />,   onClick: () => { navigate("/workflows"); setShowQuickCreate(false); } },
    { label: "New Task",        icon: <CheckSquare size={16} />,  onClick: () => { navigate("/tasks");     setShowQuickCreate(false); } },
    { label: "New Team Member", icon: <UserPlus size={16} />,     onClick: () => { navigate("/team");      setShowQuickCreate(false); } },
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
            <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl text-gray-500 transition-all"
              onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <Menu size={20} />
            </button>
          )}
          <div className="hidden md:block w-96">
            <div style={{ borderRadius: "14px", background: "rgba(255,255,255,0.75)", border: "1.5px solid rgba(99,102,241,0.2)", boxShadow: "0 2px 8px rgba(99,102,241,0.08)" }}
              onFocusCapture={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.08)"; }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(99,102,241,0.08)"; }}>
              <SearchBar placeholder="Search workflows, tasks..." />
            </div>
          </div>
          <button onClick={() => setShowSearch(true)} className="md:hidden p-2 rounded-xl text-gray-500 transition-all"
            style={{ background: "rgba(248,248,255,0.9)", border: "1.5px solid rgba(99,102,241,0.12)" }}>
            <Search size={20} />
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Create dropdown */}
          <Dropdown
            trigger={
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-white rounded-xl font-semibold text-sm transition-all"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", boxShadow: "0 2px 12px rgba(99,102,241,0.35)" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(99,102,241,0.35)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <Plus size={17} /><span className="hidden lg:inline">Create</span>
              </button>
            }
            items={quickCreateItems.map(item => ({
              label: item.label,
              icon: item.icon,
              onClick: item.onClick,
            }))}
          />

          {/* Mobile create */}
          <button onClick={() => setShowQuickCreate(true)} className="sm:hidden p-2 rounded-xl text-white"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", boxShadow: "0 2px 8px rgba(99,102,241,0.35)" }}>
            <Plus size={20} />
          </button>

          {/* Bell — opens notification panel */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(p => !p)}
              className="relative p-2.5 rounded-xl text-gray-500 transition-all"
              style={{ background: showNotifications ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.7)", border: "1.5px solid rgba(99,102,241,0.18)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.06)"}
              onMouseLeave={e => e.currentTarget.style.background = showNotifications ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.7)"}>
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 text-white text-xs rounded-full flex items-center justify-center font-bold"
                  style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)", boxShadow: "0 1px 4px rgba(244,63,94,0.5)", fontSize: "10px" }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50"
                style={{ background: "#fff", border: "1.5px solid rgba(99,102,241,0.15)", boxShadow: "0 12px 40px rgba(99,102,241,0.15), 0 4px 12px rgba(0,0,0,0.08)" }}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm">Notifications</p>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-xs font-bold rounded-full text-white" style={{ background: "#6366f1" }}>{unreadCount}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Mark all read</button>
                    )}
                    <button onClick={() => setShowNotifications(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                      <Bell size={28} className="opacity-40 mb-2" />
                      <p className="text-sm text-gray-400">No notifications</p>
                    </div>
                  ) : notifications.map(n => {
                    const Icon = n.icon;
                    return (
                      <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                        style={{ background: n.unread ? "rgba(99,102,241,0.02)" : "transparent" }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: n.bg }}>
                          <Icon size={14} style={{ color: n.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 leading-tight">{n.title}</p>
                            <button onClick={() => dismissNotif(n.id)} className="p-0.5 rounded hover:bg-gray-200 text-gray-300 hover:text-gray-500 shrink-0">
                              <X size={12} />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock size={10} className="text-gray-300" />
                            <span className="text-xs text-gray-400">{n.time}</span>
                            {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-auto" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="px-4 py-2.5 border-t border-gray-100">
                  <button onClick={() => setShowNotifications(false)} className="w-full text-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 py-1">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Avatar dropdown */}
          <Dropdown
            trigger={
              <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all"
                style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(99,102,241,0.18)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.06)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(248,248,255,0.9)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.1)"; }}>
                <Avatar name={user.name} size="sm" />
                <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
              </button>
            }
            align="right" width="w-56"
            items={[
              { label: <div className="py-2"><p className="font-semibold text-gray-900">{user.name}</p><p className="text-sm text-gray-400">{user.email}</p></div>, keepOpen: true },
              { divider: true },
              { label: "Profile Settings", icon: <User size={16} />,      onClick: () => navigate("/settings") },
              { label: "Team Settings",    icon: <Settings size={16} />,   onClick: () => navigate("/team")     },
              { label: "Help & Support",   icon: <HelpCircle size={16} />, onClick: () => navigate("/help")     },
              { divider: true },
              { label: "Sign Out", icon: <LogOut size={16} />, danger: true, onClick: () => { localStorage.clear(); window.location.href = "/login"; } },
            ]}
          />
        </div>
      </header>

      {/* Mobile search modal */}
      <Modal isOpen={showSearch} onClose={() => setShowSearch(false)} title="Search" size="full">
        <div className="p-4"><SearchBar placeholder="Search workflows, tasks..." /></div>
      </Modal>

      {/* Mobile quick create modal */}
      <Modal isOpen={showQuickCreate} onClose={() => setShowQuickCreate(false)} title="Quick Create" size="sm">
        <div className="space-y-2">
          {quickCreateItems.map((item, i) => (
            <button key={i} onClick={item.onClick}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-indigo-50 text-left transition-all border border-transparent hover:border-indigo-200">
              <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600">{item.icon}</span>
              <span className="font-medium text-gray-900">{item.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}