"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language-context";

interface AccountFormProps {
  currentEmail: string;
}

export default function AccountForm({ currentEmail }: AccountFormProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState(currentEmail);
  const [emailSaving, setEmailSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailSaving(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast.success(t.settings.profileUpdated);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update email.");
      }
    } finally {
      setEmailSaving(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error(t.settings.passwordMismatch);
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      if (res.ok) {
        toast.success(t.settings.passwordChanged);
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const data = await res.json();
        toast.error(data.error || t.settings.wrongPassword);
      }
    } finally {
      setPwSaving(false);
    }
  }

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <div className="space-y-8">
      {/* Email section */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">{t.settings.changeEmail}</h3>
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t.settings.email}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
          </div>
          <button type="submit" disabled={emailSaving} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-60">
            {emailSaving ? t.settings.saving : t.settings.changeEmail}
          </button>
        </form>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">{t.settings.changePassword}</h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t.settings.currentPassword}</label>
            <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required placeholder="--------" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t.settings.newPassword}</label>
            <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required placeholder="--------" minLength={8} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t.settings.confirmPassword}</label>
            <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required placeholder="--------" minLength={8} className={inputClass} />
          </div>
          <button type="submit" disabled={pwSaving} className="px-5 py-2.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-medium rounded-xl text-sm transition-colors disabled:opacity-60">
            {pwSaving ? t.settings.saving : t.settings.changePassword}
          </button>
        </form>
      </div>
    </div>
  );
}
