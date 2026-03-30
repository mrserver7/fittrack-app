"use client";
import { useState, useEffect, useRef } from "react";
import { Camera, Columns2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Photo {
  id: string;
  photoUrl: string;
  pose: string;
  takenAt: string;
  notes: string | null;
}

export default function ProgressPhotos({ clientId }: { clientId?: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<Photo[]>([]);
  const [sliderPos, setSliderPos] = useState(50);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pose, setPose] = useState("front");

  const fetchPhotos = () => {
    const url = clientId ? `/api/progress-photos?clientId=${clientId}` : "/api/progress-photos";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setPhotos(d.photos || []))
      .catch(() => {});
  };

  useEffect(() => { fetchPhotos(); }, [clientId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "avatars"); // reuse avatars bucket for now
      formData.append("path", `progress/${Date.now()}-${file.name}`);

      const uploadRes = await fetch("/api/settings/upload-avatar", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();

      if (uploadData.url) {
        const res = await fetch("/api/progress-photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photoUrl: uploadData.url,
            pose,
            takenAt: new Date().toISOString().split("T")[0],
          }),
        });
        if (res.ok) {
          toast.success("Photo added!");
          setShowUpload(false);
          fetchPhotos();
        }
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/progress-photos/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Photo removed"); fetchPhotos(); }
  };

  const toggleSelect = (photo: Photo) => {
    if (selected.find((p) => p.id === photo.id)) {
      setSelected(selected.filter((p) => p.id !== photo.id));
    } else if (selected.length < 2) {
      setSelected([...selected, photo]);
    }
  };

  // Compare view
  if (compareMode && selected.length === 2) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => { setCompareMode(false); setSelected([]); }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-50">Comparison</span>
          <div />
        </div>

        {/* Slider comparison */}
        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
          {/* Before (left) */}
          <div className="absolute inset-0">
            <img src={selected[0].photoUrl} alt="Before" className="w-full h-full object-cover" />
          </div>
          {/* After (right) — clipped */}
          <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}>
            <img src={selected[1].photoUrl} alt="After" className="w-full h-full object-cover" />
          </div>
          {/* Slider handle */}
          <input
            type="range" min="0" max="100" value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-col-resize z-10"
          />
          <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-20 pointer-events-none"
            style={{ left: `${sliderPos}%` }}>
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
              <ChevronLeft className="w-3 h-3 text-gray-600" />
              <ChevronRight className="w-3 h-3 text-gray-600" />
            </div>
          </div>
          {/* Labels */}
          <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg z-20">
            {selected[0].takenAt}
          </div>
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg z-20">
            {selected[1].takenAt}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-2">
        {!clientId && (
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors">
            <Camera className="w-4 h-4" /> Add Photo
          </button>
        )}
        {photos.length >= 2 && (
          <button onClick={() => setCompareMode(!compareMode)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${
              compareMode
                ? "border-emerald-200 dark:border-emerald-800 text-emerald-600 bg-emerald-50 dark:bg-emerald-950"
                : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}>
            <Columns2 className="w-4 h-4" /> {compareMode ? `Select 2 (${selected.length}/2)` : "Compare"}
          </button>
        )}
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-50">Upload Progress Photo</span>
            <button onClick={() => setShowUpload(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="flex gap-2">
            {["front", "side", "back"].map((p) => (
              <button key={p} onClick={() => setPose(p)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg ${
                  pose === p ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                }`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 hover:border-emerald-400 transition-colors">
            {uploading ? "Uploading..." : "Click to select photo"}
          </button>
        </div>
      )}

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <Camera className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No progress photos yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => {
            const isSelected = selected.find((p) => p.id === photo.id);
            return (
              <div key={photo.id} className="relative group">
                <div
                  onClick={() => compareMode ? toggleSelect(photo) : null}
                  className={`aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    isSelected ? "border-emerald-500" : "border-transparent"
                  }`}
                >
                  <img src={photo.photoUrl} alt={photo.pose} className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                  {photo.takenAt}
                </div>
                <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded capitalize">
                  {photo.pose}
                </div>
                {!compareMode && !clientId && (
                  <button onClick={() => handleDelete(photo.id)}
                    className="absolute top-1 left-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
