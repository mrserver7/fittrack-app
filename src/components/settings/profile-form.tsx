"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language-context";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";

interface ProfileFormProps {
  currentName: string;
  currentPhotoUrl: string | null;
}

export default function ProfileForm({ currentName, currentPhotoUrl }: ProfileFormProps) {
  const { t } = useLanguage();
  const { update } = useSession();
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // 1. Upload file to Supabase Storage
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/settings/upload-avatar", { method: "POST", body: formData });
      if (!uploadRes.ok) { toast.error("Upload failed."); return; }
      const { url: newUrl } = await uploadRes.json();

      // 2. Immediately persist the new URL to DB
      const saveRes = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: newUrl }),
      });
      if (!saveRes.ok) { toast.error("Failed to save photo."); return; }

      // 3. Update local state + session token so sidebar reflects change instantly
      setPhotoUrl(newUrl);
      await update({ photoUrl: newUrl });
      router.refresh();
      toast.success("Photo updated!");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemovePhoto() {
    setRemovingPhoto(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: null }),
      });
      if (res.ok) {
        setPhotoUrl("");
        await update({ photoUrl: null });
        router.refresh();
        toast.success("Photo removed.");
      } else {
        toast.error("Failed to remove photo.");
      }
    } finally {
      setRemovingPhoto(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, photoUrl }),
      });
      if (res.ok) {
        // Refresh session so sidebar name updates immediately
        await update({ name, photoUrl });
        router.refresh();
        toast.success(t.settings.profileUpdated);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save.");
      }
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center overflow-hidden">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-emerald-700 transition-colors">
            <Camera className="w-3.5 h-3.5 text-white" />
            <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} disabled={uploading} />
          </label>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{t.settings.uploadPhoto}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{uploading ? "Uploading..." : "JPG, PNG, WebP"}</p>
          {photoUrl && (
            <button type="button" onClick={handleRemovePhoto} disabled={removingPhoto}
              className="mt-1.5 flex items-center gap-1 text-xs text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors">
              <X className="w-3 h-3" />
              {removingPhoto ? "Removing..." : "Remove photo"}
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.settings.name}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <button type="submit" disabled={saving} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-60">
        {saving ? t.settings.saving : t.settings.saveProfile}
      </button>
    </form>
  );
}
