"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Dumbbell, ClipboardList, BarChart3,
  CheckSquare, LogOut, Menu, X, MessageSquare, Shield, Settings, CalendarDays,
  ShieldX, Activity, Apple, Target, Heart, Compass, ChevronRight, Trophy,
} from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import ThemeToggle from "@/components/ui/theme-toggle";
import LanguageToggle from "@/components/ui/language-toggle";
import LogoMark from "@/components/ui/logo-mark";

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: number };
type NavSection = { title?: string; items: NavItem[] };

export default function Sidebar({ role, isAdmin }: { role: "trainer" | "client"; isAdmin?: boolean }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const name = session?.user?.name ?? "";
  const email = session?.user?.email ?? "";
  const photoUrl = (session?.user as Record<string, unknown>)?.photoUrl as string | null | undefined;
  const initials = name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  const trainerSections: NavSection[] = [
    {
      items: [
        { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
        { href: "/clients", label: t.nav.clients, icon: Users },
        { href: "/clients/messages", label: t.nav.messages, icon: MessageSquare },
      ],
    },
    {
      title: t.nav.programs,
      items: [
        { href: "/programs", label: t.nav.programs, icon: ClipboardList },
        { href: "/exercises", label: t.nav.exercises, icon: Dumbbell },
      ],
    },
    {
      title: t.nav.analytics,
      items: [
        { href: "/analytics", label: t.nav.analytics, icon: BarChart3 },
        { href: "/tasks", label: t.nav.tasks, icon: CheckSquare },
        { href: "/challenges", label: t.nav.challenges, icon: Trophy },
      ],
    },
  ];

  const clientSections: NavSection[] = [
    {
      items: [
        { href: "/home", label: t.nav.dashboard, icon: LayoutDashboard },
        { href: "/schedule", label: t.nav.schedule, icon: CalendarDays },
        { href: "/workouts", label: t.nav.workouts, icon: Dumbbell },
      ],
    },
    {
      title: t.nav.explore,
      items: [
        { href: "/explore", label: t.nav.explore, icon: Compass },
        { href: "/nutrition", label: t.nav.nutrition, icon: Apple },
        { href: "/habits", label: t.nav.habits, icon: Target },
      ],
    },
    {
      items: [
        { href: "/progress", label: t.nav.progress, icon: BarChart3 },
        { href: "/my-challenges", label: t.nav.challenges, icon: Trophy },
        { href: "/community", label: t.nav.community, icon: Heart },
        { href: "/messages", label: t.nav.messages, icon: MessageSquare },
        { href: "/checkins", label: t.nav.checkins, icon: CheckSquare },
      ],
    },
  ];

  const adminSection: NavSection = {
    title: t.nav.admin,
    items: [
      { href: "/admin", label: t.nav.adminOverview, icon: Shield },
      { href: "/admin/trainers", label: t.nav.trainers, icon: Users },
      { href: "/admin/subscribers", label: t.nav.allSubscribers, icon: Users },
      { href: "/admin/banned", label: t.nav.bannedUsers, icon: ShieldX },
      { href: "/admin/messages", label: t.nav.messages, icon: MessageSquare },
      { href: "/admin/login-log", label: t.nav.loginLog, icon: Activity },
    ],
  };

  const sections = role === "trainer" ? trainerSections : clientSections;

  const NavLink = ({ item, isAdminLink }: { item: NavItem; isAdminLink?: boolean }) => {
    const Icon = item.icon;
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    const activeColor = isAdminLink ? "text-purple-600 dark:text-purple-400" : "text-emerald-600 dark:text-emerald-400";
    const activeBg = isAdminLink
      ? "bg-purple-50 dark:bg-purple-500/10"
      : "bg-emerald-50 dark:bg-emerald-500/10";

    return (
      <Link
        href={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 group relative",
          active
            ? `${activeBg} ${activeColor} font-semibold`
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
        )}
      >
        {active && (
          <span className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full",
            isAdminLink ? "bg-purple-500" : "bg-emerald-500"
          )} />
        )}
        <Icon className={cn(
          "w-[18px] h-[18px] flex-shrink-0 transition-colors",
          active ? activeColor : "text-muted-foreground/70 group-hover:text-foreground/80"
        )} />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge && item.badge > 0 && (
          <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const NavContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 flex-shrink-0 border-b border-border">
        <LogoMark size={28} />
        <span className="font-bold text-foreground tracking-tight">FitTrack</span>
      </div>

      {/* User card */}
      <div className="px-3 pt-4 pb-2">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/50">
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center ring-2 ring-emerald-500/20">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-emerald-700 dark:text-emerald-300 font-bold text-xs">{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">{name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{email}</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto no-scrollbar">
        {sections.map((section, i) => (
          <div key={i}>
            {section.title && (
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.08em] px-3 mb-1.5">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        ))}

        {isAdmin && (
          <div className="pt-2 border-t border-border">
            <p className="text-[10px] font-semibold text-purple-500/60 dark:text-purple-400/60 uppercase tracking-[0.08em] px-3 mb-1.5">
              {adminSection.title}
            </p>
            <div className="space-y-0.5">
              {adminSection.items.map((item) => (
                <NavLink key={item.href} item={item} isAdminLink />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom controls */}
      <div className="flex-shrink-0 border-t border-border">
        <div className="px-3 py-2">
          <Link
            href={role === "trainer" ? "/settings" : "/account"}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all group",
              (pathname === "/settings" || pathname === "/account")
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <Settings className="w-[18px] h-[18px]" />
            <span className="flex-1">{t.nav.settings}</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </Link>
        </div>
        <div className="px-3 py-2 flex items-center gap-1 border-t border-border">
          <ThemeToggle />
          <LanguageToggle />
          <div className="flex-1" />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t.nav.signOut}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 glass border-b border-border flex items-center px-4 gap-3">
        <button onClick={() => setOpen(!open)}
          className="p-2 rounded-lg hover:bg-muted transition-colors">
          {open ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
        </button>
        <div className="flex items-center gap-2 flex-1">
          <LogoMark size={22} />
          <span className="font-bold text-foreground text-sm tracking-tight">FitTrack</span>
        </div>
        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">{initials}</span>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/30 z-40 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        "md:hidden fixed left-0 rtl:left-auto rtl:right-0 top-0 h-full w-72 z-50 shadow-2xl transition-transform duration-300 ease-out",
        open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
      )}>
        <NavContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-[260px] h-screen sticky top-0 flex-shrink-0">
        <NavContent />
      </div>
    </>
  );
}
