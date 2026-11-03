// src/components/Layout.tsx — app shell with top nav + logout.
import { type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const navItem = (to: string, label: string) => {
    const active = location.pathname.startsWith(to);
    return (
      <Link
        to={to}
        className={`px-3 py-2 rounded-md text-sm font-medium transition ${
          active ? "bg-brand-600 text-white" : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 flex-wrap">
          <Link to="/" className="flex items-center gap-2 mr-4">
            <div className="h-8 w-8 rounded-md bg-brand-600 text-white grid place-items-center font-bold">BC</div>
            <div>
              <div className="text-sm font-semibold leading-tight">Bel Central LLG</div>
              <div className="text-xs text-slate-500 leading-tight">Record Book</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 flex-1">
            {navItem("/dashboard", "Dashboard")}
            {navItem("/residents", "Residents")}
            {navItem("/reports", "Reports")}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden sm:block text-right">
              <div className="font-medium text-slate-700">{user?.username}</div>
              <div className="text-xs text-slate-500">
                {isAdmin ? "Administrator" : "Ward Official"}
              </div>
            </div>
            <button onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">{children}</main>
      <footer className="text-center text-xs text-slate-400 py-4">
        Bel Central LLG · Record Book Management System
      </footer>
    </div>
  );
}
