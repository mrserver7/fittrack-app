"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Trophy, Target, Flame, Medal, Users, Calendar, Lock } from "lucide-react";

type Entry = { clientId: string; currentValue: number };
type Challenge = {
  id: string; title: string; description: string | null; type: string;
  targetValue: number | null; unit: string | null; startDate: string; endDate: string;
  isActive: boolean; _count: { entries: number };
  entries: Entry[];
};
type EnrolledEntry = {
  challengeId: string; currentValue: number;
  challenge: Challenge & { entries: { clientId: string; currentValue: number }[] };
};

const TYPE_ICONS: Record<string, React.ElementType> = { volume: Flame, consistency: Target, custom: Trophy };

export default function ClientChallengesPage() {
  const [enrolled, setEnrolled] = useState<EnrolledEntry[]>([]);
  const [available, setAvailable] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/challenges");
    if (res.ok) {
      const d = await res.json();
      setEnrolled(d.enrolled || []);
      setAvailable(d.available || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const joinChallenge = async (id: string) => {
    setJoining(id);
    const res = await fetch(`/api/challenges/${id}/enroll`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    if (res.ok) { toast.success("You've joined the challenge! 🏆"); load(); }
    else { const d = await res.json(); toast.error(d.error || "Failed to join"); }
    setJoining(null);
  };

  const today = new Date().toISOString().split("T")[0];

  const myRank = (e: EnrolledEntry) => {
    const sorted = [...e.challenge.entries].sort((a, b) => b.currentValue - a.currentValue);
    return sorted.findIndex((x) => x.clientId === e.clientId) + 1;
  };

  const pct = (current: number, target: number | null) => {
    if (!target) return null;
    return Math.min(100, Math.round((current / target) * 100));
  };

  if (loading) return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-8 animate-pulse">
        <div className="w-8 h-8 bg-muted rounded-lg" />
        <div className="w-36 h-7 bg-muted rounded-lg" />
      </div>
      <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="section-card h-32 animate-pulse" />)}</div>
    </div>
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center">
          <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Challenges</h1>
          <p className="text-sm text-muted-foreground">{enrolled.length} active · {available.length} available to join</p>
        </div>
      </div>

      {/* My challenges */}
      {enrolled.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">My Challenges</h2>
          <div className="space-y-4">
            {enrolled.map((e) => {
              const c = e.challenge;
              const TypeIcon = TYPE_ICONS[c.type] || Trophy;
              const rank = myRank(e);
              const progress = pct(e.currentValue, c.targetValue);
              const isLive = c.startDate <= today && c.endDate >= today;
              const isEnded = c.endDate < today;

              return (
                <div key={e.challengeId} className="section-card p-5">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isEnded ? "bg-muted" : "bg-amber-100 dark:bg-amber-500/20"}`}>
                      <TypeIcon className={`w-5 h-5 ${isEnded ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-foreground">{c.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                          isEnded ? "bg-muted text-muted-foreground" : isLive ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300"
                        }`}>{isEnded ? "Ended" : isLive ? "Live" : "Upcoming"}</span>
                      </div>
                      {c.description && <p className="text-sm text-muted-foreground mt-0.5">{c.description}</p>}

                      {/* My stats */}
                      <div className="mt-3 grid grid-cols-3 gap-3">
                        <div className="bg-muted/40 rounded-xl p-3 text-center">
                          <p className="text-lg font-bold text-foreground">{e.currentValue}</p>
                          <p className="text-xs text-muted-foreground">{c.unit || (c.type === "consistency" ? "workouts" : "kg")}</p>
                        </div>
                        <div className="bg-muted/40 rounded-xl p-3 text-center">
                          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">#{rank || "—"}</p>
                          <p className="text-xs text-muted-foreground">Rank</p>
                        </div>
                        <div className="bg-muted/40 rounded-xl p-3 text-center">
                          <p className="text-lg font-bold text-foreground">{c._count.entries}</p>
                          <p className="text-xs text-muted-foreground">Participants</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      {progress !== null && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress toward target</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? "bg-emerald-500" : "bg-amber-400"}`}
                              style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Mini leaderboard */}
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Medal className="w-3 h-3" /> Top participants</p>
                        <div className="space-y-1.5">
                          {[...c.entries].sort((a, b) => b.currentValue - a.currentValue).slice(0, 3).map((entry, idx) => (
                            <div key={entry.clientId} className="flex items-center justify-between text-xs">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] mr-2 flex-shrink-0 ${
                                idx === 0 ? "bg-amber-400 text-white" : idx === 1 ? "bg-gray-300 dark:bg-gray-600 text-foreground" : "bg-amber-700 text-white"
                              }`}>{idx + 1}</span>
                              <span className={`flex-1 truncate ${entry.clientId === e.clientId ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                                {entry.clientId === e.clientId ? "You" : "Participant"}
                              </span>
                              <span className="font-semibold text-foreground">{entry.currentValue} {c.unit || ""}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {c.startDate} → {c.endDate}</span>
                        {c.targetValue && <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Target: {c.targetValue} {c.unit}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Available to join */}
      {available.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Available to Join</h2>
          <div className="space-y-3">
            {available.map((c) => {
              const TypeIcon = TYPE_ICONS[c.type] || Trophy;
              return (
                <div key={c.id} className="section-card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TypeIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{c.title}</h3>
                    {c.description && <p className="text-sm text-muted-foreground truncate">{c.description}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {c.startDate} → {c.endDate}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c._count.entries} joined</span>
                    </div>
                  </div>
                  <button
                    onClick={() => joinChallenge(c.id)}
                    disabled={joining === c.id}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors flex-shrink-0"
                  >
                    {joining === c.id ? "Joining..." : "Join"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {enrolled.length === 0 && available.length === 0 && (
        <div className="text-center py-20 section-card border-dashed">
          <Lock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No challenges yet</h3>
          <p className="text-sm text-muted-foreground">Your trainer hasn't created any challenges yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
