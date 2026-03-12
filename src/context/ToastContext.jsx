import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Shorthand helpers
  const toast = {
    success: (msg) => addToast(msg, "success"),
    error:   (msg) => addToast(msg, "error"),
    warning: (msg) => addToast(msg, "warning"),
    info:    (msg) => addToast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ─── Toast Container ──────────────────────────────────────────────────────────

const STYLES = {
  success: { bg: "#f0fdf4", border: "#bbf7d0", icon: CheckCircle2, iconColor: "#16a34a", text: "#15803d" },
  error:   { bg: "#fef2f2", border: "#fecaca", icon: XCircle,      iconColor: "#dc2626", text: "#b91c1c" },
  warning: { bg: "#fffbeb", border: "#fde68a", icon: AlertTriangle, iconColor: "#d97706", text: "#b45309" },
  info:    { bg: "#eff6ff", border: "#bfdbfe", icon: Info,          iconColor: "#2563eb", text: "#1d4ed8" },
};

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(100%) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to   { opacity: 0; transform: translateX(100%) scale(0.95); }
        }
        .toast-item {
          animation: toastIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          font-family: 'DM Sans', sans-serif;
        }
      `}</style>

      <div style={{
        position: "fixed",
        top: "1.25rem",
        right: "1.25rem",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "0.625rem",
        maxWidth: "360px",
        width: "100%",
        pointerEvents: "none",
      }}>
        {toasts.map(toast => {
          const s = STYLES[toast.type] || STYLES.info;
          const Icon = s.icon;
          return (
            <div key={toast.id} className="toast-item"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                padding: "0.875rem 1rem",
                borderRadius: "0.875rem",
                background: s.bg,
                border: `1px solid ${s.border}`,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                pointerEvents: "all",
              }}
            >
              <Icon size={18} style={{ color: s.iconColor, marginTop: "1px", flexShrink: 0 }} />
              <p style={{ flex: 1, fontSize: "0.875rem", fontWeight: 500, color: s.text, lineHeight: 1.4 }}>
                {toast.message}
              </p>
              <button onClick={() => onRemove(toast.id)}
                style={{ color: s.iconColor, opacity: 0.6, cursor: "pointer",
                  background: "none", border: "none", padding: 0, flexShrink: 0,
                  display: "flex", alignItems: "center" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}