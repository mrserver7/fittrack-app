"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [form, setForm] = useState({ name: "", password: "" });
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) { toast.error("Please accept the health disclaimer to continue."); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setLoading(true);
    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: form.password, name: form.name }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error || "Something went wrong.");
    } else {
      toast.success("Account activated! Please sign in.");
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <img src="/logo.png" alt="FitTrack" className="w-9 h-9 rounded-xl object-contain" />
            <span className="font-bold text-xl text-gray-900">FitTrack</span>
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🎉</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">You&#39;ve been invited!</h1>
            <p className="text-gray-500 text-sm">Set up your client account to view workouts and track progress.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                placeholder="Your full name"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Create Password *</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required
                placeholder="Min. 8 characters" minLength={8}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <input type="checkbox" id="disclaimer" checked={accepted} onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-emerald-600" />
              <label htmlFor="disclaimer" className="text-sm text-amber-800 leading-relaxed cursor-pointer">
                I confirm I have consulted a physician and take full responsibility for my participation in exercise programming. I understand FitTrack is not a medical service.
              </label>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-60">
              {loading ? "Activating..." : "Activate My Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
