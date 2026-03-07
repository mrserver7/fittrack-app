"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import LogoMark from "@/components/ui/logo-mark";
import { AlertCircle, XCircle, Clock, Mail, Ban } from "lucide-react";

type BlockedStatus = "pending" | "invited" | "archived" | "rejected" | "invalid" | null;

const statusConfig: Record<
  Exclude<BlockedStatus, "invalid" | null>,
  { icon: React.ElementType; color: string; title: string; body: string }
> = {
  rejected: {
    icon: XCircle,
    color: "red",
    title: "Account Rejected",
    body: "Your account has been rejected. Please contact your trainer for more information.",
  },
  archived: {
    icon: Ban,
    color: "red",
    title: "Account Removed",
    body: "Your account has been removed. Please contact your trainer if you believe this is a mistake.",
  },
  pending: {
    icon: Clock,
    color: "amber",
    title: "Awaiting Approval",
    body: "Your account is pending approval. Your trainer will review and approve your request soon.",
  },
  invited: {
    icon: Mail,
    color: "blue",
    title: "Invitation Pending",
    body: "Please use the invitation link sent to your email to activate your account.",
  },
};

const colorClasses: Record<string, { bg: string; border: string; icon: string; title: string; body: string }> = {
  red:   { bg: "bg-red-50 dark:bg-red-950/30",   border: "border-red-200 dark:border-red-800",   icon: "text-red-500",   title: "text-red-800 dark:text-red-300",   body: "text-red-600 dark:text-red-400" },
  amber: { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", icon: "text-amber-500", title: "text-amber-800 dark:text-amber-300", body: "text-amber-600 dark:text-amber-400" },
  blue:  { bg: "bg-blue-50 dark:bg-blue-950/30",  border: "border-blue-200 dark:border-blue-800",  icon: "text-blue-500",  title: "text-blue-800 dark:text-blue-300",  body: "text-blue-600 dark:text-blue-400" },
};

export default function LoginPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState<BlockedStatus>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setBlocked(null);

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (!result?.error) {
      router.push("/");
      router.refresh();
      return;
    }

    // Sign-in failed — check if it's a specific block reason
    try {
      const res = await fetch("/api/auth/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setBlocked(data.reason ?? "invalid");
    } catch {
      setBlocked("invalid");
    }
  };

  const cfg = blocked && blocked !== "invalid" ? statusConfig[blocked] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <LogoMark size={36} />
            <span className="font-bold text-xl text-gray-900 dark:text-gray-50">FitTrack</span>
          </Link>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">{t.auth.welcomeBack}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{t.auth.signInToAccount}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.auth.email}</label>
              <input
                type="email" value={email} onChange={(e) => { setEmail(e.target.value); setBlocked(null); }} required
                placeholder={t.auth.emailPlaceholder} autoComplete="email"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.auth.password}</label>
              <input
                type="password" value={password} onChange={(e) => { setPassword(e.target.value); setBlocked(null); }} required
                placeholder="••••••••" autoComplete="current-password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Error / blocked state */}
            {blocked === "invalid" && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">Incorrect email or password.</p>
              </div>
            )}

            {cfg && (() => {
              const Icon = cfg.icon;
              const c = colorClasses[cfg.color];
              return (
                <div className={`flex items-start gap-3 p-4 rounded-xl border ${c.bg} ${c.border}`}>
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.icon}`} />
                  <div>
                    <p className={`text-sm font-semibold ${c.title}`}>{cfg.title}</p>
                    <p className={`text-sm mt-0.5 ${c.body}`}>{cfg.body}</p>
                  </div>
                </div>
              );
            })()}

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-60"
            >
              {loading ? t.auth.signingIn : t.auth.signIn}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800 space-y-2 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              {t.auth.trainer}{" "}
              <Link href="/register?tab=trainer" className="text-emerald-600 font-medium hover:underline">{t.auth.createTrainerLink}</Link>
            </p>
            <p>
              {t.auth.newSubscriber}{" "}
              <Link href="/register?tab=subscriber" className="text-emerald-600 font-medium hover:underline">{t.auth.signUpHere}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
