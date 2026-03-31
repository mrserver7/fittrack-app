"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Trophy, Plus, Users, Target, Flame, Calendar, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Medal } from "lucide-react";

type ChallengeEntry = { clientId: string; currentValue: number; client: { id: string; name: string; photoUrl: string | null } };
type Challenge = {
  id: string; title: string; description: string | null; type: string;
  targetValue: number | null; unit: string | null; startDate: string; endDate: string;
  isActive: boolean; createdAt: string;
  entries: ChallengeEntry[];
  _count: { entries: number };
};

const TYPE_LABELS: Record<string, string> = { volume: "Volume (kg)", consistency: "Workouts", custom: "Custom" };
const TYPE_ICONS: Record<string, React.ElementType> = { volume: Flame, consistency: Target, custom: Trophy };

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", type: "consistency", targetValue: "",
    unit: "", startDate: "", endDate: "", enrollAll: true, clientIds: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [cRes, clRes] = await Promise.all([
      fetch("/api/challenges"),
      fetch("/api/clients"),
    ]);
    if (cRes.ok) { const d = await cRes.json(); setChallenges(d.challenges || []); }
    if (clRes.ok) { const d = await clRes.json(); setClients((d.clients || []).filter((c: { status: string }) => c.status === "active")); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        targetValue: form.targetValue ? parseFloat(form.targetValue) : null,
        unit: form.unit || null,
      }),
    });
    if (res.ok) {
      toast.success("Challenge created!");
      setShowForm(false);
      setForm({ title: "", description: "", type: "consistency", targetValue: "", unit: "", startDate: "", endDate: "", enrollAll: true, clientIds: [] });
      load();
    } else {
      const d = await res.json(); toast.error(d.error || "Failed to create challenge");
    }
    setSaving(false);
  };

  const toggleActive = async (c: Challenge) => {
    const res = await fetch(`/api/challenges/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    if (res.ok) { toast.success(c.isActive ? "Challenge deactivated" : "Challenge activated"); load(); }
  };

  const deleteChallenge = async (id: string) => {
    if (!confirm("Delete this challenge and all entries?")) return;
    const res = await fetch(`/api/challenges/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Challenge deleted"); load(); }
  };

  const today = new Date().toISOString().split("T")[0];

  const getProgress = (c: Challenge, entry: ChallengeEntry) => {
    if (!c.targetValue) return null;
    return Math.min(100, Math.round((entry.currentValue / c.targetValue) * 100));
  };

  if (loading) return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-8 animate-pulse">
        <div className="w-8 h-8 bg-muted rounded-lg" />
        <div className="w-40 h-7 bg-muted rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1,2,3].map(i => <div key={i} className="section-card h-40 animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Challenges</h1>
            <p className="text-sm text-muted-foreground">{challenges.length} challenge{challenges.length !== 1 ? "s" : ""} created</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Challenge
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="section-card p-6 mb-6 border-emerald-200 dark:border-emerald-500/30">
          <h2 className="font-semibold text-foreground mb-4">Create Challenge</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="e.g. 10K kg Volume Challenge" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Type *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                  <option value="consistency">Consistency — most workouts completed</option>
                  <option value="volume">Volume — most total kg lifted</option>
                  <option value="custom">Custom — manual progress</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                placeholder="Optional: describe the goal or prize" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Target</label>
                <input type="number" value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="e.g. 10000" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Unit</label>
                <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="kg / workouts" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Start Date *</label>
                <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">End Date *</label>
                <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} required
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.enrollAll} onChange={e => setForm(f => ({ ...f, enrollAll: e.target.checked }))}
                  className="rounded" />
                <span className="text-sm text-foreground">Enroll all active clients ({clients.length})</span>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-border rounded-xl text-sm text-foreground hover:bg-muted/60 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                {saving ? "Creating..." : "Create Challenge"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Challenge list */}
      {challenges.length === 0 ? (
        <div className="text-center py-20 section-card border-dashed">
          <Trophy className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No challenges yet</h3>
          <p className="text-sm text-muted-foreground">Create your first challenge to motivate clients with friendly competition.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {challenges.map((c) => {
            const TypeIcon = TYPE_ICONS[c.type] || Trophy;
            const isExpanded = expanded === c.id;
            const isLive = c.startDate <= today && c.endDate >= today;
            const isEnded = c.endDate < today;

            return (
              <div key={c.id} className="section-card overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isEnded ? "bg-muted" : c.isActive ? "bg-amber-100 dark:bg-amber-500/20" : "bg-muted"
                    }`}>
                      <TypeIcon className={`w-5 h-5 ${isEnded ? "text-muted-foreground" : c.isActive ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{c.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isEnded ? "bg-muted text-muted-foreground" :
                          isLive && c.isActive ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" :
                          "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300"
                        }`}>
                          {isEnded ? "Ended" : isLive ? (c.isActive ? "Live" : "Paused") : "Upcoming"}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {TYPE_LABELS[c.type]}
                        </span>
                      </div>
                      {c.description && <p className="text-sm text-muted-foreground mt-0.5">{c.description}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {c.startDate} → {c.endDate}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c._count.entries} enrolled</span>
                        {c.targetValue && <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Target: {c.targetValue} {c.unit}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleActive(c)} title={c.isActive ? "Deactivate" : "Activate"}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        {c.isActive ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button onClick={() => deleteChallenge(c.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setExpanded(isExpanded ? null : c.id)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Leaderboard */}
                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 bg-muted/20">
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Medal className="w-4 h-4 text-amber-500" /> Leaderboard
                    </h4>
                    {c.entries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No participants yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {c.entries.map((entry, idx) => {
                          const pct = getProgress(c, entry);
                          return (
                            <div key={entry.clientId} className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                idx === 0 ? "bg-amber-400 text-white" : idx === 1 ? "bg-gray-300 dark:bg-gray-600 text-foreground" : idx === 2 ? "bg-amber-700 text-white" : "bg-muted text-muted-foreground"
                              }`}>{idx + 1}</span>
                              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                                {entry.client.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-foreground truncate">{entry.client.name}</span>
                                  <span className="text-sm font-semibold text-foreground ml-2 flex-shrink-0">
                                    {entry.currentValue} {c.unit || (c.type === "consistency" ? "workouts" : "kg")}
                                  </span>
                                </div>
                                {pct !== null && (
                                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
                                  </div>
                                )}
                              </div>
                              {pct !== null && (
                                <span className="text-xs text-muted-foreground flex-shrink-0 w-10 text-right">{pct}%</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
