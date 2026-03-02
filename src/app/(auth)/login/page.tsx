"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language-context";
import LogoMark from "@/components/ui/logo-mark";

export default function LoginPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      toast.error("Incorrect email or password. If you signed up recently, your account may still be pending approval.");
    } else {
      router.push("/");
      router.refresh();
    }
  };

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
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder={t.auth.emailPlaceholder} autoComplete="email"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.auth.password}</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder="••••••••" autoComplete="current-password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
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
