"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Copy, CheckCircle } from "lucide-react";

export default function NewClientPage() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", goalsText: "", injuriesText: "",
    startDate: new Date().toISOString().split("T")[0], tags: "", trainerNotes: "",
  });
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error || "Failed to add client.");
    } else {
      const link = `${window.location.origin}/invite/${data.invitationToken}`;
      setInviteLink(link);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied to clipboard!");
  };

  if (inviteLink) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Client Added!</h2>
          <p className="text-gray-500 mb-6">
            Share this invitation link with <strong>{form.name}</strong>. It expires in 72 hours.
          </p>
          <div className="flex items-center gap-2 p-3.5 bg-gray-50 rounded-xl border border-gray-200 mb-6 text-left">
            <code className="flex-1 text-sm text-gray-700 truncate">{inviteLink}</code>
            <button onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors flex-shrink-0">
              <Copy className="w-3 h-3" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push("/clients")}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              Back to Clients
            </button>
            <button onClick={() => router.push("/clients")}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors">
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {hint && <span className="ml-1 text-xs text-red-500 font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent";
  const textareaClass = `${inputClass} resize-none`;

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/clients">
          <button className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Client</h1>
          <p className="text-gray-500 text-sm">An invitation link will be generated after saving</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-gray-400">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name *">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                placeholder="Priya Sharma" className={inputClass} />
            </Field>
            <Field label="Email *">
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                placeholder="client@example.com" className={inputClass} />
            </Field>
            <Field label="Phone">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 555 000 0000" className={inputClass} />
            </Field>
            <Field label="Start Date">
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className={inputClass} />
            </Field>
          </div>
          <Field label="Tags (comma-separated)">
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="fat-loss, intermediate, morning" className={inputClass} />
          </Field>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-400">Health & Goals</h2>
          <Field label="Goals">
            <textarea rows={3} value={form.goalsText} onChange={(e) => setForm({ ...form, goalsText: e.target.value })}
              placeholder="What does this client want to achieve?" className={textareaClass} />
          </Field>
          <Field label="Injuries / Contraindications" hint="(sensitive — kept private)">
            <textarea rows={3} value={form.injuriesText} onChange={(e) => setForm({ ...form, injuriesText: e.target.value })}
              placeholder="e.g. Left knee meniscus — no deep knee flexion" className={textareaClass} />
          </Field>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-400 mb-4">Private Trainer Notes</h2>
          <textarea rows={3} value={form.trainerNotes} onChange={(e) => setForm({ ...form, trainerNotes: e.target.value })}
            placeholder="Private notes — only you can see these." className={textareaClass} />
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/clients">
            <button type="button" className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </Link>
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60">
            {loading ? "Adding..." : "Add Client & Generate Invite"}
          </button>
        </div>
      </form>
    </div>
  );
}
