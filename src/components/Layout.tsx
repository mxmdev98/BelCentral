// src/components/Layout.tsx — app shell with top nav + dropdown menus.
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ALL_RESOURCES } from "../config/permissions";

interface NavLink {
  path: string;
  label: string;
}

// Population registry: people-centric registers.
const POPULATION_KEYS = new Set([
  "residents",
  "ward_officials",
  "disabled_persons",
  "deaths",
  "births",
  "marriages",
  "tenants",
  "people_movement",
]);

// Land registry: places & infrastructure. villages + tribes/clans are
// admin-managed master lists (not per-user permission resources), so they
// are shown only to admins. The rest are permission-gated registers.
const LAND_PERMISSION_KEYS = new Set(["houses", "projects", "schools"]);
const LAND_ADMIN_LINKS: NavLink[] = [
  { path: "/villages", label: "Villages" },
  { path: "/tribes-clans", label: "Tribes & Clans" },
];

function NavDropdown({
  label,
  links,
  location,
}: {
  label: string;
  links: NavLink[];
  location: ReturnType<typeof useLocation>;
}) {
  const [open, setOpen] = useState(false);

  // Close whenever the route changes.
  useEffect(() => setOpen(false), [location.pathname]);

  if (links.length === 0) return null;
  const active = links.some((l) => location.pathname.startsWith(l.path));

  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1 ${
          active ? "bg-brand-600 text-white" : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        {label}
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 4.5l3 3 3-3" />
        </svg>
      </button>
      {open && (
        <>
          {/* transparent backdrop catches outside clicks */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-40">
            {links.map((l) => {
              const isActive = location.pathname.startsWith(l.path);
              return (
                <Link
                  key={l.path}
                  to={l.path}
                  className={`block px-3 py-2 text-sm ${
                    isActive
                      ? "bg-brand-50 text-brand-700 font-medium"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout, isAdmin, can } = useAuth();
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

  // Build the two dropdown link lists from ALL_RESOURCES + permission checks.
  const populationLinks: NavLink[] = ALL_RESOURCES.filter(
    (r) => POPULATION_KEYS.has(r.key) && can(r.key, "read")
  ).map((r) => ({ path: r.path, label: r.label }));

  const landLinks: NavLink[] = [
    ...(isAdmin ? LAND_ADMIN_LINKS : []),
    ...ALL_RESOURCES.filter(
      (r) => LAND_PERMISSION_KEYS.has(r.key) && can(r.key, "read")
    ).map((r) => ({ path: r.path, label: r.label })),
  ];

  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 flex-wrap">
          <Link to="/" className="flex items-center gap-2 mr-4">
            <div className="h-8 w-8 rounded-md bg-brand-600 text-white grid place-items-center font-bold">BC</div>
            <div>
              <div className="text-sm font-semibold leading-tight">Bel Central</div>
              <div className="text-xs text-slate-500 leading-tight">Ward Record Book</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 flex-wrap">
            {navItem("/dashboard", "Dashboard")}
            <NavDropdown label="Population Registry" links={populationLinks} location={location} />
            <NavDropdown label="Land Registry" links={landLinks} location={location} />
            {navItem("/reports", "Reports")}
            {isAdmin && navItem("/admin", "Admin")}
          </nav>
          <div className="flex items-center gap-3 text-sm ml-auto">
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
        Bel Central · Ward Record Book Management System
      </footer>
    </div>
  );
}
