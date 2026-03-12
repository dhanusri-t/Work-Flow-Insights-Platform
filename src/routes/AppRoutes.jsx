import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Workflows from "../pages/Workflows";
import WorkflowDetails from "../pages/WorkflowDetails";
import Tasks from "../pages/Tasks";
import Team from "../pages/Team";
import NotFound from "../pages/NotFound";
import MainLayout from "../layouts/MainLayout";

const isAuthenticated = () => !!localStorage.getItem("token");

const PrivateRoute = ({ children }) =>
  isAuthenticated() ? children : <Navigate to="/login" replace />;

const PublicRoute = ({ children }) =>
  isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root → redirect based on auth */}
      <Route path="/" element={
        isAuthenticated()
          ? <Navigate to="/dashboard" replace />
          : <Navigate to="/login" replace />
      } />

      {/* Login — redirect to dashboard if already logged in */}
      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />

      {/* Protected routes */}
      <Route element={
        <PrivateRoute><MainLayout /></PrivateRoute>
      }>
        <Route path="/dashboard"     element={<Dashboard />} />
        <Route path="/workflows"     element={<Workflows />} />
        <Route path="/workflows/:id" element={<WorkflowDetails />} />
        <Route path="/tasks"         element={<Tasks />} />
        <Route path="/team"          element={<Team />} />
        <Route path="/analytics"     element={<AnalyticsPlaceholder />} />
        <Route path="/settings"      element={<SettingsPlaceholder />} />
        <Route path="/help"          element={<HelpPlaceholder />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AnalyticsPlaceholder() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h2>
        <p className="text-gray-500 max-w-md">Gain insights into your workflow performance and team productivity.</p>
      </div>
    </div>
  );
}

function SettingsPlaceholder() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
        <p className="text-gray-500 max-w-md">Configure your workspace settings and account preferences.</p>
      </div>
    </div>
  );
}

function HelpPlaceholder() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Help & Support</h2>
        <p className="text-gray-500 max-w-md">Get help with Flowcraft and browse documentation.</p>
      </div>
    </div>
  );
}