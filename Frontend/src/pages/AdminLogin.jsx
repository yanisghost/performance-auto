import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in as admin/manager
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const userStr = localStorage.getItem("adminUser");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === "admin" || user.role === "manager") {
          navigate("/admin/dashboard");
        }
      } catch (e) {
        localStorage.clear();
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to log in. Please check your credentials.");
      }

      const user = data.data?.user || data.user;
      const token = data.token;

      if (!token || !user) {
        throw new Error("Invalid response from server.");
      }

      // Check role
      if (user.role !== "admin" && user.role !== "manager") {
        throw new Error("Access denied. Admin or manager privileges required.");
      }

      // Store in localStorage
      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminUser", JSON.stringify(user));

      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0F0F0F] text-[#e2e2e2] min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-[#1a1c1c] border border-white/10 p-8 rounded-sm shadow-2xl relative overflow-hidden">
        {/* Border Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary-container"></div>

        <div className="text-center mb-8">
          <h2 className="font-display-lg text-2xl uppercase tracking-wider font-extrabold text-white">
            Performance Auto
          </h2>
          <p className="text-xs text-on-surface-variant/80 uppercase tracking-widest font-semibold mt-1">
            Admin Portal
          </p>
        </div>

        {error && (
          <div className="bg-[#5d3f3d]/20 border border-[#ae8885] text-[#ffb3af] px-4 py-3 text-xs rounded-sm mb-6 flex items-start gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-sm flex-shrink-0 mt-0.5">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@performanceauto.com"
                className="w-full bg-[#282a2b] border border-white/10 py-3 px-4 pl-11 text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none focus:border-[#ffb3af]/50 rounded-sm transition-all"
              />
              <span className="material-symbols-outlined absolute left-4 top-3.5 text-base text-on-surface-variant/50">
                mail
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#282a2b] border border-white/10 py-3 px-4 pl-11 text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none focus:border-[#ffb3af]/50 rounded-sm transition-all"
              />
              <span className="material-symbols-outlined absolute left-4 top-3.5 text-base text-on-surface-variant/50">
                lock
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container text-white py-3.5 px-4 font-label-bold uppercase tracking-widest text-xs font-bold rounded-sm shadow-md hover:bg-[#b50321] active:scale-98 transition-all disabled:opacity-55 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Authenticating...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
