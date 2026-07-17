import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  // Authenticate user & role
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const userStr = localStorage.getItem("adminUser");
    
    if (!token || !userStr) {
      localStorage.clear();
      navigate("/admin/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== "admin" && user.role !== "manager") {
        localStorage.clear();
        navigate("/admin/login");
      } else {
        setAdminUser(user);
      }
    } catch (e) {
      localStorage.clear();
      navigate("/admin/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  const navLinks = [
    { label: "Dashboard", path: "/admin/dashboard", icon: "dashboard" },
    { label: "Vehicles", path: "/admin/vehicles", icon: "directions_car" },
    { label: "Categories", path: "/admin/categories", icon: "category" }
  ];

  if (!adminUser) return null; // Prevent layout flash before redirecting

  return (
    <div className="bg-[#0F0F0F] text-[#e2e2e2] min-h-screen flex flex-col md:flex-row font-body-md">
      
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-[#1a1c1c] border-b border-white/10 px-6 py-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-xl font-bold">tune</span>
          <span className="font-display-lg font-extrabold text-sm uppercase tracking-wider text-white">
            PA Admin Portal
          </span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white hover:text-[#ffb3af] transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">
            {mobileMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-[#1a1c1c] border-r border-white/10 flex flex-col z-20 transition-transform duration-300 md:translate-x-0 md:static md:h-screen
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-2xl font-bold">tune</span>
          <div>
            <h1 className="font-display-lg text-sm font-extrabold text-white uppercase tracking-wider">
              Performance Auto
            </h1>
            <p className="text-[10px] text-on-surface-variant font-label-bold uppercase tracking-widest mt-0.5">
              Admin Portal
            </p>
          </div>
        </div>

        {/* User Info Card */}
        <div className="p-4 mx-4 my-6 bg-[#0c0f0f] border border-white/5 flex items-center gap-3 rounded-sm">
          <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center border border-primary-container/40">
            <span className="material-symbols-outlined text-primary-container font-semibold text-lg">admin_panel_settings</span>
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-white truncate">{adminUser.name}</h4>
            <p className="text-[9px] text-on-surface-variant uppercase tracking-wider font-semibold truncate">{adminUser.role}</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-grow px-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3.5 px-4 py-3 text-xs font-label-bold uppercase tracking-wider rounded-sm transition-all duration-200
                  ${isActive 
                    ? "bg-[#282a2b] border-l-2 border-[#ffb3af] text-[#ffb3af] font-bold" 
                    : "text-on-surface-variant hover:bg-[#282a2b]/40 hover:text-white"
                  }
                `}
              >
                <span className={`material-symbols-outlined text-base ${isActive ? "text-[#ffb3af]" : "text-on-surface-variant/70"}`}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Operations */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3.5 px-4 py-3 text-xs font-label-bold uppercase tracking-wider text-on-surface-variant hover:text-white rounded-sm hover:bg-[#282a2b]/30 transition-all"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Client Website
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 text-xs font-label-bold uppercase tracking-wider text-[#ffb3af] hover:bg-[#5d3f3d]/20 hover:text-white rounded-sm transition-all text-left"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0 md:h-screen md:overflow-y-auto">
        <main className="p-6 md:p-10 max-w-7xl w-full mx-auto animate-fadeIn">
          <Outlet />
        </main>
      </div>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-10 md:hidden animate-fadeIn"
        ></div>
      )}

    </div>
  );
}
