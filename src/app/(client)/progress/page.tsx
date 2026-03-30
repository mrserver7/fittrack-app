"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { formatDate } from "@/lib/utils";
import { TrendingUp, Award, Activity, Plus, Camera } from "lucide-react";
import ProgressPhotos from "@/components/progress/progress-photos";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/contexts/language-context";

type Measurement = {
  id: string; recordedDate: string; weightKg: number | null;
  bodyFatPct: number | null; waistCm: number | null; createdAt: string;
};
type PR = { id: string; valueKg: number; repsAtPr: number | null; recordedAt: string; exercise: { name: string } };

export default function ProgressPage() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const clientId = (session?.user as Record<string, unknown>)?.id as string;
  const [tab, setTab] = useState<"measurements" | "prs" | "photos">("measurements");
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [prs, setPrs] = useState<PR[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogForm, setShowLogForm] = useState(false);
  const [form, setForm] = useState({ recordedDate: new Date().toISOString().split("T")[0], weightKg: "", bodyFatPct: "", waistCm: "", notes: "" });

  useEffect(() => {
    if (!clientId) return;
    const load = async () => {
      const [mRes] = await Promise.all([fetch(`/api/measurements/${clientId}`)]);
      if (mRes.ok) setMeasurements((await mRes.json()).measurements || []);
      setLoading(false);
    };
    load();
    fetch(`/api/clients/${clientId}`).then(r => r.json()).then(d => {
      setPrs(d.client?.personalRecords || []);
    });
  }, [clientId]);

  const submitMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/measurements/${clientId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setMeasurements((prev) => [data.measurement, ...prev]);
      setShowLogForm(false);
      setForm({ recordedDate: new Date().toISOString().split("T")[0], weightKg: "", bodyFatPct: "", waistCm: "", notes: "" });
    }
  };

  const weightData = [...measurements].reverse().filter((m) => m.weightKg).map((m) => ({
    date: m.recordedDate,
    weight: m.weightKg,
  }));

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <div className="page-container max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t.progress.title}</h1>
        <button onClick={() => setShowLogForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors">
          <Plus className="w-4 h-4" /> {t.progress.logMeasurement}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {(["measurements", "prs", "photos"] as const).map((tabKey) => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === tabKey ? "bg-emerald-600 text-white shadow-sm" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-emerald-300 dark:hover:border-emerald-700"}`}>
            {tabKey === "measurements" ? t.progress.measurements : tabKey === "prs" ? t.progress.personalRecords : "Photos"}
          </button>
        ))}
      </div>

      {tab === "measurements" && (
        <div className="space-y-5">
          {weightData.length > 1 && (
            <div className="section-card-padded">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> {t.progress.weightTrend}
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                  <Tooltip formatter={(v) => [`${v}kg`, "Weight"]} />
                  <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="section-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">{t.progress.measurementHistory}</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">{t.progress.loading}</div>
            ) : measurements.length === 0 ? (
              <div className="p-8 text-center">
                <Activity className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">{t.progress.noMeasurements}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-xs text-muted-foreground uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">{t.progress.date}</th>
                      <th className="px-4 py-3 text-right">{t.progress.weight}</th>
                      <th className="px-4 py-3 text-right">{t.progress.bodyFat}</th>
                      <th className="px-4 py-3 text-right">{t.progress.waist}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.map((m, idx) => {
                      const prev = measurements[idx + 1];
                      const weightDiff = prev?.weightKg && m.weightKg ? m.weightKg - prev.weightKg : null;
                      return (
                        <tr key={m.id} className="border-t border-border hover:bg-muted/60">
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(m.recordedDate)}</td>
                          <td className="px-4 py-3 text-right font-medium text-foreground">
                            {m.weightKg ? `${m.weightKg}kg` : "---"}
                            {weightDiff !== null && (
                              <span className={`ml-1.5 text-xs ${weightDiff < 0 ? "text-emerald-600" : "text-red-500"}`}>
                                {weightDiff > 0 ? "+" : ""}{weightDiff.toFixed(1)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{m.bodyFatPct ? `${m.bodyFatPct}%` : "---"}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{m.waistCm ? `${m.waistCm}cm` : "---"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "prs" && (
        <div className="section-card">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> {t.progress.personalRecords}
            </h2>
          </div>
          {prs.length === 0 ? (
            <div className="p-8 text-center">
              <Award className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">{t.progress.noPRs}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-5">
              {prs.map((pr) => (
                <div key={pr.id} className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium truncate">{pr.exercise.name}</p>
                  <p className="text-2xl font-bold text-amber-800 dark:text-amber-300 mt-1">{pr.valueKg}kg</p>
                  {pr.repsAtPr && <p className="text-xs text-amber-600 dark:text-amber-400">x {pr.repsAtPr} reps</p>}
                  <p className="text-xs text-amber-400 dark:text-amber-500 mt-2">{formatDate(pr.recordedAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "photos" && (
        <div className="section-card-padded">
          <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <Camera className="w-4 h-4 text-emerald-600" /> Progress Photos
          </h2>
          <ProgressPhotos />
        </div>
      )}

      {showLogForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowLogForm(false)}>
          <div className="section-card-padded w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-foreground mb-4">{t.progress.logMeasurementTitle}</h2>
            <form onSubmit={submitMeasurement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t.progress.dateLabel}</label>
                <input type="date" value={form.recordedDate} onChange={(e) => setForm({ ...form, recordedDate: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t.progress.weightKg}</label>
                  <input type="number" step="0.1" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} placeholder="70.5" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t.progress.bodyFatPct}</label>
                  <input type="number" step="0.1" value={form.bodyFatPct} onChange={(e) => setForm({ ...form, bodyFatPct: e.target.value })} placeholder="18.5" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t.progress.waistCm}</label>
                <input type="number" step="0.1" value={form.waistCm} onChange={(e) => setForm({ ...form, waistCm: e.target.value })} placeholder="80" className={inputClass} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowLogForm(false)} className="flex-1 py-2.5 border border-border text-muted-foreground rounded-xl text-sm hover:bg-muted/60">{t.common.cancel}</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold">{t.common.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
