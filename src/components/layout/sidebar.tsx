"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Dumbbell, ClipboardList, BarChart3,
  CheckSquare, LogOut, Menu, X, MessageSquare, Shield, Settings,
} from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import ThemeToggle from "@/components/ui/theme-toggle";
import LanguageToggle from "@/components/ui/language-toggle";

export default function Sidebar({ role, isAdmin }: { role: "trainer" | "client"; isAdmin?: boolean }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const name = session?.user?.name ?? "";
  const email = session?.user?.email ?? "";
  const initials = name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  const trainerNav = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/clients", label: t.nav.clients, icon: Users },
    { href: "/programs", label: t.nav.programs, icon: ClipboardList },
    { href: "/exercises", label: t.nav.exercises, icon: Dumbbell },
    { href: "/analytics", label: t.nav.analytics, icon: BarChart3 },
    { href: "/tasks", label: t.nav.tasks, icon: CheckSquare },
    { href: "/settings", label: t.nav.settings, icon: Settings },
  ];

  const clientNav = [
    { href: "/home", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/workout/today", label: t.nav.todaysWorkout, icon: Dumbbell },
    { href: "/progress", label: t.nav.progress, icon: BarChart3 },
    { href: "/messages", label: t.nav.messages, icon: MessageSquare },
    { href: "/checkins", label: t.nav.checkins, icon: CheckSquare },
    { href: "/account", label: t.nav.settings, icon: Settings },
  ];

  const adminNav = [
    { href: "/admin", label: t.nav.adminOverview, icon: Shield },
    { href: "/admin/trainers", label: t.nav.trainers, icon: Users },
    { href: "/admin/subscribers", label: t.nav.allSubscribers, icon: Users },
  ];

  const nav = role === "trainer" ? trainerNav : clientNav;

  const NavContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        {logoError ? (
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">FT</div>
        ) : (
          <img src="/logo.png" alt="FitTrack" className="w-8 h-8 rounded-lg flex-shrink-0 object-contain" onError={() => setLogoError(true)} />
        )}
        <span className="font-bold text-gray-900 dark:text-gray-50">FitTrack</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50"
              )}>
              <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500")} />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.nav.admin}</p>
            </div>
            {adminNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    active
                      ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-semibold"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50"
                  )}>
                  <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-purple-600 dark:text-purple-400" : "text-gray-400 dark:text-gray-500")} />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Preferences toggles */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      {/* Bottom: user + signout */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 transition-colors mb-1">
          <LogOut className="w-4 h-4" />
          {t.nav.signOut}
        </button>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-xs flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">{name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 left-4 rtl:left-auto rtl:right-4 z-50 p-2 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        {open ? <X className="w-5 h-5 text-gray-700 dark:text-gray-300" /> : <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        "md:hidden fixed left-0 rtl:left-auto rtl:right-0 top-0 h-full w-64 z-50 shadow-xl transition-transform duration-300",
        open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
      )}>
        <NavContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-60 h-screen sticky top-0 flex-shrink-0">
        <NavContent />
      </div>
    </>
  );
}
