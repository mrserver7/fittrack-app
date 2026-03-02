"use client";
import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

type ExerciseOption = { id: string; name: string };

export default function ExerciseSelect({
  value,
  exercises,
  onChange,
  placeholder = "— Select exercise —",
  loading = false,
}: {
  value: string;
  exercises: ExerciseOption[];
  onChange: (id: string, name: string) => void;
  placeholder?: string;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = exercises.find((e) => e.id === value);
  const filtered = search
    ? exercises.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
    : exercises;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <span className={selected ? "text-gray-900 dark:text-gray-50 truncate" : "text-gray-400 dark:text-gray-500"}>
          {loading ? "Loading…" : selected?.name || placeholder}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search exercises…"
                autoFocus
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No exercises found</p>
            ) : (
              filtered.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => {
                    onChange(ex.id, ex.name);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    ex.id === value
                      ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium"
                      : "text-gray-900 dark:text-gray-50 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {ex.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
