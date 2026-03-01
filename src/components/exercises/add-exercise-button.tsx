"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function AddExerciseButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", category: "other", primaryMuscles: "", equipment: "",
    defaultSets: 3, defaultReps: 10, coachingNotes: "", bodyRegions: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Exercise added!");
      setOpen(false);
      window.location.reload();
    } else {
      toast.error("Failed to add exercise.");
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors">
        <Plus className="w-4 h-4" /> Add Exercise
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-gray-900 mb-4">Add Custom Exercise</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  placeholder="Romanian Deadlift" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                    {["push","pull","hinge","squat","carry","core","cardio","mobility","other"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Sets</label>
                  <input type="number" min={1} max={20} value={form.defaultSets}
                    onChange={(e) => setForm({ ...form, defaultSets: +e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Muscles</label>
                <input value={form.primaryMuscles} onChange={(e) => setForm({ ...form, primaryMuscles: e.target.value })}
                  placeholder="Glutes, Hamstrings" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Equipment</label>
                <input value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                  placeholder="Barbell, Dumbbells" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Body Regions (for injury matching)</label>
                <input value={form.bodyRegions} onChange={(e) => setForm({ ...form, bodyRegions: e.target.value })}
                  placeholder="knee, lower_back" className={inputClass} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60">
                  {loading ? "Adding..." : "Add Exercise"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
