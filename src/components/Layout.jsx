import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "New clip" },
  { to: "/twitch", label: "Twitch" },
  { to: "/accounts", label: "Accounts" },
  { to: "/campaigns", label: "Campaigns" },
  { to: "/tools", label: "Tools" },
  { to: "/library", label: "Library" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[68px] max-w-[1440px] flex-wrap items-center gap-4 px-5 py-3 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="brandmark text-[22px]">Above Yellow</span>
            <span className="markdot" />
          </Link>

          <nav className="flex items-center gap-1 pl-2 sm:pl-6">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                  path === item.to
                    ? "bg-black/[0.05] text-black"
                    : "text-black/50 hover:text-black"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {user?.email && (
              <span className="hidden text-[12px] text-black/40 sm:block">{user.email}</span>
            )}
            <button
              type="button"
              onClick={() => logout()}
              className="pill pill-ghost h-9 px-4 text-[13px]"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 pb-28 sm:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-black/[0.06] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 text-[12px] text-black/35">
          <span className="brandmark text-[13px] text-black/60">Above Yellow</span>
          <span>·</span>
          <span>Clip only what you own or have permission to clip. Credit the creator in every caption.</span>
        </div>
      </footer>
    </div>
  );
}