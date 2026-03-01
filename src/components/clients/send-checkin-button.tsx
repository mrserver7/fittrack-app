"use client";
import { useState } from "react";
import { toast } from "sonner";
import { ClipboardCheck, X, Loader2 } from "lucide-react";

type CheckInForm = { id: string; name: string };

export default function SendCheckinButton({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [forms, setForms] = useState<CheckInForm[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [selectedForm, setSelectedForm] = useState("");
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const [sending, setSending] = useState(false);

  const openModal = async () => {
    setOpen(true);
    if (forms.length > 0) return;
    setLoadingForms(true);
    try {
      const res = await fetch("/api/checkin-forms");
      const data = await res.json();
      setForms(data.forms || []);
      if (data.forms?.length > 0) setSelectedForm(data.forms[0].id);
    } catch {
      toast.error("Failed to load check-in forms");
    } finally {
      setLoadingForms(false);
    }
  };

  const handleSend = async () => {
    if (!selectedForm) { toast.error("Please select a form"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, checkInFormId: selectedForm, periodStart, periodEnd }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Check-in sent to client!");
      setOpen(false);
    } catch {
      toast.error("Failed to send check-in");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <ClipboardCheck className="w-4 h-4" />
        Send Check-in
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-50">Send Check-in</h2>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Check-in Form</label>
                {loadingForms ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading forms...
                  </div>
                ) : (
                  <select
                    value={selectedForm}
                    onChange={(e) => setSelectedForm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">— Select form —</option>
                    {forms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Period Start</label>
                  <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Period End</label>
                  <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500">
                The client will receive a notification and can fill in the form from their Check-ins page.
              </p>
            </div>

            <div className="flex gap-3 p-5 pt-0">
              <button onClick={() => setOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button onClick={handleSend} disabled={sending || !selectedForm}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Send Check-in"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
