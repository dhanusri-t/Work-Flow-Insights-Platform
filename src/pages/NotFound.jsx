import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(160deg, #f5f5ff 0%, #f8f9fc 60%, #f0f4ff 100%)" }}>

      <div className="text-center max-w-lg">

        {/* 404 number */}
        <p className="font-black text-gray-950 select-none mb-4"
          style={{ fontSize: "clamp(6rem, 20vw, 10rem)", lineHeight: 1, letterSpacing: "-0.04em" }}>
          404
        </p>

        {/* Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          This page doesn't exist
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          The page you're looking for may have been moved, deleted, or never existed.
          Double-check the URL or head back to safety.
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
              border border-gray-200 bg-white text-gray-700 transition-all hover:border-indigo-300 hover:bg-indigo-50">
            <ArrowLeft size={15} /> Go Back
          </button>
          <button onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)", boxShadow: "0 2px 10px rgba(99,102,241,0.35)" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            <Home size={15} /> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}