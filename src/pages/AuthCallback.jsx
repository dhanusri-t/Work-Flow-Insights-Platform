import { useEffect, useState } from "react";
import { useNavigate }         from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";

/**
 * AuthCallback.jsx
 *
 * Google OAuth redirects to /auth/callback?token=xxx&user=yyy after login.
 * This page reads those params, saves them to localStorage, and sends
 * the user to /dashboard. If anything is missing it shows an error.
 *
 * Register in AppRoutes.jsx:
 *   <Route path="/auth/callback" element={<AuthCallback />} />
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");
    const raw    = params.get("user");
    const err    = params.get("error");

    // Handle explicit error from backend (e.g. unknown Google account)
    if (err) {
      const messages = {
        google_failed: "Google sign-in failed. Please try again or use email and password.",
      };
      setError(messages[err] || "Sign-in failed. Please try again.");
      return;
    }

    if (!token || !raw) {
      setError("Sign-in failed — missing credentials. Please try again.");
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(raw));
      localStorage.setItem("token", token);
      localStorage.setItem("user",  JSON.stringify(user));
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Sign-in failed — could not read account data. Please try again.");
    }
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm w-full text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Sign-in failed</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm text-gray-500">Signing you in…</p>
      </div>
    </div>
  );
}