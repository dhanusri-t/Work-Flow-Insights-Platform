import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Workflow,
  ListChecks,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  Users,
  BarChart3,
  FolderKanban,
  X,
  HelpCircle,
  Zap
} from "lucide-react";
import Navbar from "../components/Navbar";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/workflows", icon: Workflow, label: "Workflows" },
  { to: "/tasks", icon: ListChecks, label: "Tasks" },
  { to: "/team", icon: Users, label: "Team" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
];

const bottomNavItems = [
  { to: "/settings", icon: Settings, label: "Settings" },
  { to: "/help", icon: HelpCircle, label: "Help & Support" },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
      isActive
        ? "bg-indigo-50 text-indigo-700"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  const collapsedLinkClass = ({ isActive }) =>
    `flex items-center justify-center p-2.5 rounded-xl transition-all duration-200 ${
      isActive
        ? "bg-indigo-50 text-indigo-700"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
    }`;

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 flex items-center justify-between">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center w-full" : ""}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold text-gray-900">Flowcraft</span>
          )}
        </div>
        
        {/* Mobile Close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <X size={20} />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Workspace Selector */}
      {!collapsed && (
        <div className="px-4 mb-4">
          <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FolderKanban className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Acme Corp</p>
                <p className="text-xs text-gray-500">Enterprise Plan</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className={`px-3 flex-1 ${collapsed ? "px-2" : ""}`}>
        {/* Main Nav */}
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={collapsed ? collapsedLinkClass : linkClass}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon size={20} className={collapsed ? "" : "group-hover:scale-110 transition-transform"} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {/* Bottom Nav */}
        <div className={`mt-8 pt-4 border-t border-gray-100 space-y-1 ${collapsed ? "px-2" : ""}`}>
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={collapsed ? collapsedLinkClass : linkClass}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className={`p-4 border-t border-gray-100 ${collapsed ? "px-2" : ""}`}>
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut size={20} />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] bg-white animate-slideIn">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar 
          onMenuClick={() => setMobileOpen(true)} 
          showMenuButton={true}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
