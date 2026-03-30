"use client";
import { useState } from "react";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";

type Program = { id: string; name: string; durationWeeks: number };

export default function AssignProgramButton({ clientId, programs }: { clientId: string; programs: Program[] }) {
  const [open, setOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const assign = async () => {
    if (!selectedProgram) { toast.error("Please select a program."); return; }
    setLoading(true);
    const res = await fetch(`/api/programs/${selectedProgram}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, startDate }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Program assigned successfully!");
      setOpen(false);
      window.location.reload();
    } else {
      toast.error("Failed to assign program.");
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors">
        <ClipboardList className="w-4 h-4" /> Assign Program
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-foreground mb-4">Assign Program</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Select Program</label>
                <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">-- Choose a program --</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.durationWeeks}w)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setOpen(false)}
                className="flex-1 py-2.5 border border-border text-foreground rounded-xl text-sm font-medium hover:bg-muted/60 transition-colors">
                Cancel
              </button>
              <button onClick={assign} disabled={loading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60">
                {loading ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
