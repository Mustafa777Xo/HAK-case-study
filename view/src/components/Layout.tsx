import { NavLink, Outlet } from "react-router-dom";
import { useUserStore } from "@/store/useUserStore";

const navLinks = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/requests", label: "Requests" },
  { to: "/approvals", label: "My Approvals" },
];

export default function Layout() {
  const { currentUser, clearUser } = useUserStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-brand-800 text-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold tracking-tight">HAK Approval System</span>
          {currentUser && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-brand-200">
                {currentUser.name} · {currentUser.department}
              </span>
              <button
                onClick={clearUser}
                className="rounded bg-brand-700 px-3 py-1 text-xs hover:bg-brand-600 transition-colors"
              >
                Switch user
              </button>
            </div>
          )}
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 px-4 pb-2">
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-brand-200 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
