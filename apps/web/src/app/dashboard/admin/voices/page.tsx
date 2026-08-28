"use client";

import * as React from "react";
import toast from "react-hot-toast";

interface PlatformVoiceItem {
  id: string;
  fishAudioId: string;
  name: string;
  gender: string;
  category: string;
  language: string;
  languageName: string;
  tags: string[];
  previewAudioUrl?: string | null;
  isPremium: boolean;
  isActive: boolean;
  order: number;
  createdAt: string;
}

export default function PlatformVoicesPage() {
  const [voices, setVoices] = React.useState<readonly PlatformVoiceItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // New Voice Form State
  const [fishAudioId, setFishAudioId] = React.useState("");
  const [name, setName] = React.useState("");
  const [gender, setGender] = React.useState("female");
  const [category, setCategory] = React.useState("conversational");
  const [language, setLanguage] = React.useState("en-US");
  const [languageName, setLanguageName] = React.useState("English (United States) 🇺🇸");
  const [tags, setTags] = React.useState("Warm, Podcast, Friendly");
  const [previewAudioUrl, setPreviewAudioUrl] = React.useState("");
  const [isPremium, setIsPremium] = React.useState(true);

  const fetchVoices = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/voices");
      const json = await res.json();
      if (res.ok && json.success) {
        setVoices(json.data);
      }
    } catch {
      toast.error("Failed to load platform voices");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  // Toggle Active Status
  const handleToggleActive = async (voice: PlatformVoiceItem) => {
    try {
      const res = await fetch(`/api/admin/voices/${voice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !voice.isActive }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Voice "${voice.name}" is now ${!voice.isActive ? "ACTIVE" : "INACTIVE"}`);
        fetchVoices();
      }
    } catch {
      toast.error("Failed to update voice status");
    }
  };

  // Delete Voice
  const handleDeleteVoice = async (voice: PlatformVoiceItem) => {
    if (!confirm(`Are you sure you want to remove ${voice.name} from the platform catalog?`)) return;
    try {
      const res = await fetch(`/api/admin/voices/${voice.id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Removed ${voice.name} from platform voices.`);
        fetchVoices();
      }
    } catch {
      toast.error("Error deleting voice");
    }
  };

  // Add Voice Handler
  const handleAddVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fishAudioId.trim() || !name.trim()) {
      toast.error("Please provide both the Fish Audio Model ID and Actor Name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/voices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fishAudioId: fishAudioId.trim(),
          name: name.trim(),
          gender,
          category,
          language,
          languageName,
          tags: tagList,
          previewAudioUrl: previewAudioUrl.trim() || null,
          isPremium,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Voice Actor "${name}" added to Azure database & live studio!`);
        setIsAddModalOpen(false);
        setFishAudioId("");
        setName("");
        setTags("");
        fetchVoices();
      } else {
        toast.error(json.error?.message || "Failed to add voice");
      }
    } catch {
      toast.error("Network error adding voice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Platform AI Voices Manager
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Register new Fish Audio reference model IDs, edit delivery tags, and control platform voice availability.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-glow hover:bg-primary/90 transition-all flex items-center gap-1.5"
        >
          <span>✨ Add New Voice Actor</span>
        </button>
      </div>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && (
          <div className="col-span-full p-12 text-center text-muted-foreground animate-pulse">
            Loading official voices from Azure PostgreSQL...
          </div>
        )}

        {!isLoading && voices.length === 0 && (
          <div className="col-span-full p-12 text-center text-muted-foreground border border-dashed border-border/80 rounded-2xl">
            No voices registered yet. Click &quot;Add New Voice Actor&quot; above.
          </div>
        )}

        {voices.map((voice) => (
          <div
            key={voice.id}
            className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-4 ${
              voice.isActive
                ? "border-border/60 bg-card/70 backdrop-blur-md shadow-sm"
                : "border-border/30 bg-card/30 opacity-60"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase">
                    {voice.name.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      {voice.name}
                      {voice.isPremium && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent/20 text-accent font-semibold">
                          HD
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {voice.languageName} • {voice.gender}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    voice.isActive
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {voice.isActive ? "ACTIVE" : "DISABLED"}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="text-muted-foreground text-[11px]">
                  <span>Category: </span>
                  <span className="text-foreground capitalize font-medium">{voice.category}</span>
                </div>

                <div className="text-[10px] font-mono text-primary truncate">
                  ID: {voice.fishAudioId}
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border/40">
                {voice.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded bg-background/80 text-muted-foreground border border-border/40"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs">
              <button
                type="button"
                onClick={() => handleToggleActive(voice)}
                className={`text-xs font-semibold hover:underline ${
                  voice.isActive ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {voice.isActive ? "Disable Voice" : "Enable Voice"}
              </button>

              <button
                type="button"
                onClick={() => handleDeleteVoice(voice)}
                className="text-xs text-destructive hover:underline"
              >
                Delete Voice
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Voice Actor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="font-extrabold text-base text-foreground">
                Add New Fish Audio Platform Voice
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVoice} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Fish Audio Reference Model ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. b347db033a6549378b48d00acb0d06cd"
                  value={fishAudioId}
                  onChange={(e) => setFishAudioId(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:border-primary outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Actor Display Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Selene, David, Sophia..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Gender Tone
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-border bg-background text-foreground outline-none"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Category Style
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-border bg-background text-foreground outline-none"
                  >
                    <option value="conversational">Conversational</option>
                    <option value="narrative">Narrative</option>
                    <option value="commercial">Commercial</option>
                    <option value="meditation">Meditation</option>
                    <option value="executive">Executive / Corporate</option>
                    <option value="educational">Educational</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Language Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. en-US, ur-PK, hi-IN"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Language Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. English (United States) 🇺🇸"
                    value={languageName}
                    onChange={(e) => setLanguageName(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Acoustic Tags (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Warm, Podcast, Deep Voice, Storytelling"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground outline-none"
                />
              </div>

              <div>
                <label className="font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Sample Preview Audio URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. /audio/previews/selene.mp3"
                  value={previewAudioUrl}
                  onChange={(e) => setPreviewAudioUrl(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPremiumVoice"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="isPremiumVoice" className="font-semibold text-foreground">
                  Mark as HD Neural Premium Voice Actor
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold shadow-md"
                >
                  {isSubmitting ? "Registering..." : "Add to Platform Catalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
