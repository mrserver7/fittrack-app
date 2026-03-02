"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language-context";
import LogoMark from "@/components/ui/logo-mark";

function RegisterForm() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "subscriber" ? "subscriber" : "trainer";
  const [tab, setTab] = useState<"trainer" | "subscriber">(initialTab);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [trainerForm, setTrainerForm] = useState({ name: "", email: "", password: "", confirmPassword: "", businessName: "" });
  const [subForm, setSubForm] = useState({ name: "", email: "", password: "", confirmPassword: "", phone: "", goalsText: "" });

  const submitTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trainerForm.password !== trainerForm.confirmPassword) {
      toast.error(t.auth.passwordsDoNotMatch);
      return;
    }
    if (trainerForm.password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trainerForm.name, email: trainerForm.email, password: trainerForm.password, businessName: trainerForm.businessName }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error || "Registration failed.");
    } else {
      toast.success("Trainer account created! Please sign in.");
      router.push("/login");
    }
  };

  const submitSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subForm.password !== subForm.confirmPassword) {
      toast.error(t.auth.passwordsDoNotMatch);
      return;
    }
    if (subForm.password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/register-subscriber", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: subForm.name, email: subForm.email, password: subForm.password, phone: subForm.phone, goalsText: subForm.goalsText }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error || "Sign up failed.");
    } else {
      toast.success("Request sent! An admin will review and assign your trainer.");
      router.push("/login");
    }
  };

  const inputClass = "w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent";

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
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 p-1 mb-6">
            {(["trainer", "subscriber"] as const).map((tabKey) => (
              <button key={tabKey} type="button" onClick={() => setTab(tabKey)}
                className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all ${tab === tabKey ? "bg-emerald-500 text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
                {tabKey === "trainer" ? t.auth.trainerTab : t.auth.subscriberTab}
              </button>
            ))}
          </div>

          {tab === "trainer" ? (
            <>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">{t.auth.createTrainerAccount}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">{t.auth.startManaging}</p>
              <form onSubmit={submitTrainer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.auth.fullName} *</label>
                  <input value={trainerForm.name} onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })} required placeholder={t.auth.trainerNamePlaceholder} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.auth.businessName}</label>
                  <input value={trainerForm.businessName} onChange={(e) => setTrainerForm({ ...trainerForm, businessName: e.target.value })} placeholder={t.auth.businessNamePlaceholder} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.auth.email} *</label>
                  <input type="email" value={trainerForm.email} onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })} required placeholder={t.auth.trainerEmailPlaceholder} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.auth.password} *</label>
                  <input type="password" value={trainerForm.password} onChange={(e) => setTrainerForm({ ...trainerForm, password: e.target.value })} required placeholder={t.auth.minPassword} minLength={8} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.auth.confirmPassword} *</label>
                  <input type="password" value={trainerForm.confirmPassword} onChange={(e) => setTrainerForm({ ...trainerForm, confirmPassword: e.target.value })} required placeholder={t.auth.minPassword} minLength={8} className={inputClass} />
                </div>
                <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-60">
                  {loading ? t.auth.creatingAccount : t.auth.createTrainerBtn}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">{t.auth.joinAsSubscriber}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">{t.auth.adminAssignsTrainer}</p>
              <form onSubmit={submitSubscriber} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.auth.fullName} *</label>
                  <input value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} required placeholder={t.auth.namePlaceholder} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.auth.email} *</label>
                  <input type="email" value={subForm.email} onChange={(e) => setSubForm({ ...subForm, email: e.target.value })} required placeholder={t.auth.emailPlaceholder} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.auth.password} *</label>
                  <input type="password" value={subForm.password} onChange={(e) => setSubForm({ ...subForm, password: e.target.value })} required placeholder={t.auth.minPassword} minLength={8} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.auth.confirmPassword} *</label>
                  <input type="password" value={subForm.confirmPassword} onChange={(e) => setSubForm({ ...subForm, confirmPassword: e.target.value })} required placeholder={t.auth.minPassword} minLength={8} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.auth.phone}</label>
                  <input value={subForm.phone} onChange={(e) => setSubForm({ ...subForm, phone: e.target.value })} placeholder={t.auth.phonePlaceholder} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.auth.goals}</label>
                  <textarea rows={2} value={subForm.goalsText} onChange={(e) => setSubForm({ ...subForm, goalsText: e.target.value })}
                    placeholder={t.auth.goalsPlaceholder} className={`${inputClass} resize-none`} />
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <p className="text-xs text-amber-800 dark:text-amber-300">{t.auth.healthDisclaimer}</p>
                </div>
                <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-60">
                  {loading ? t.auth.sendingRequest : t.auth.requestToJoin}
                </button>
              </form>
            </>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.auth.alreadyHaveAccount}{" "}
              <Link href="/login" className="text-emerald-600 font-medium hover:underline">{t.auth.signIn}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
