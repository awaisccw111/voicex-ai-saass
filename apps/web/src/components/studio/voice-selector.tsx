"use client";

import * as React from "react";
import Link from "next/link";
import { Badge, Button } from "@saas/ui";
import { PRESET_VOICES } from "@saas/core";
import { useStudioStore } from "@/store/useStudioStore";
import type { VoiceModel } from "@saas/types";

export const VoiceSelector: React.FC = () => {
  const { selectedVoiceId, setSelectedVoiceId } = useStudioStore();
  const [playingPreviewId, setPlayingPreviewId] = React.useState<string | null>(null);
  const [customVoices, setCustomVoices] = React.useState<readonly VoiceModel[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Fetch user custom cloned voices
  React.useEffect(() => {
    async function loadClonedVoices() {
      try {
        const res = await fetch("/api/clone");
        const json = await res.json();
        if (res.ok && json.success && Array.isArray(json.data)) {
          const mapped: VoiceModel[] = json.data.map((c: { id: string; fishAudioId: string; name: string; gender: string; language: string }) => ({
            id: c.fishAudioId,
            name: `${c.name} (Cloned)`,
            gender: (c.gender === "male" || c.gender === "female" ? c.gender : "neutral") as VoiceModel["gender"],
            category: "conversational",
            language: c.language as VoiceModel["language"],
            languageName: `Custom Cloned Voice`,
            previewAudioUrl: "/audio/previews/aurora.mp3",
            avatarUrl: "/avatars/aurora.webp",
            supportedEmotions: ["neutral"],
            isPremium: true,
            tags: ["Cloned Voice", "Zero-Shot", "Custom Model"],
          }));
          setCustomVoices(mapped);
        }
      } catch {
        // ignore
      }
    }
    loadClonedVoices();
  }, []);

  const allVoices = React.useMemo(() => {
    return [...customVoices, ...PRESET_VOICES];
  }, [customVoices]);

  // Active Selected Voice
  const activeVoice: VoiceModel =
    allVoices.find((v) => v.id === selectedVoiceId) ??
    customVoices[0] ??
    PRESET_VOICES[0]!;

  const handleTogglePreview = (e: React.MouseEvent, voice: VoiceModel) => {
    e.stopPropagation();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (playingPreviewId === voice.id) {
        window.speechSynthesis.cancel();
        setPlayingPreviewId(null);
        return;
      }

      window.speechSynthesis.cancel();
      setPlayingPreviewId(voice.id);

      const sampleText = `Hello, I'm ${voice.name}. This is a sample of my studio voice.`;
      const utterance = new SpeechSynthesisUtterance(sampleText);

      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) =>
        v.lang.toLowerCase().includes(voice.language.slice(0, 2).toLowerCase()),
      );
      if (match) utterance.voice = match;

      utterance.onend = () => setPlayingPreviewId(null);
      utterance.onerror = () => setPlayingPreviewId(null);

      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingPreviewId(voice.id);
      setTimeout(() => setPlayingPreviewId(null), 3000);
    }
  };

  const isPreviewingActive = playingPreviewId === activeVoice.id;
  const isCloned = activeVoice.tags.includes("Cloned Voice");

  const modalFilteredVoices = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allVoices;
    return allVoices.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.languageName.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [allVoices, searchQuery]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
          2. Selected AI Voice Actor
        </label>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/clone">
            <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary">
              ✨ Clone Voice
            </Button>
          </Link>
          <Link href="/dashboard/voices">
            <Button variant="outline" size="sm" className="text-xs">
              🔍 100+ Catalog →
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Selected Voice Card */}
      <div className="p-4 rounded-2xl border border-primary/40 bg-gradient-to-tr from-card via-card/80 to-primary/5 shadow-card transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm uppercase shrink-0 shadow-md ${
                isCloned
                  ? "bg-gradient-to-tr from-primary to-accent text-white"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {activeVoice.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-foreground">
                  {activeVoice.name}
                </span>
                {isCloned ? (
                  <Badge variant="glow" size="sm">
                    Cloned Model
                  </Badge>
                ) : activeVoice.isPremium ? (
                  <Badge variant="glow" size="sm">
                    HD Neural
                  </Badge>
                ) : null}
              </div>

              <p className="text-xs text-muted-foreground mt-0.5">
                {activeVoice.languageName} • <span className="capitalize">{activeVoice.gender}</span> • <span className="capitalize">{activeVoice.category}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Audio Preview Button */}
            <Button
              size="sm"
              variant={isPreviewingActive ? "primary" : "secondary"}
              onClick={(e) => handleTogglePreview(e, activeVoice)}
              leftIcon={
                isPreviewingActive ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )
              }
            >
              {isPreviewingActive ? "Playing..." : "Sample Audio"}
            </Button>

            {/* Quick Switcher Modal Trigger */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsModalOpen(true)}
              leftIcon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              }
            >
              Change Actor
            </Button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap pt-3 mt-3 border-t border-border/40 text-xs">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Acoustic Tags:</span>
          {activeVoice.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 rounded-md bg-background/80 text-muted-foreground border border-border/40"
            >
              {tag}
            </span>
          ))}
          <span className="text-[10px] text-muted-foreground/70 ml-auto font-mono">
            Model: {activeVoice.id.slice(0, 12)}...
          </span>
        </div>
      </div>

      {/* Quick Switcher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-border/60 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">Select Voice Actor</h3>
                <p className="text-xs text-muted-foreground">
                  Choose from your cloned voices or preset neural actors
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60"
              >
                ✕
              </button>
            </div>

            {/* Modal Search */}
            <div className="p-3 border-b border-border/40 bg-background/50">
              <input
                type="text"
                placeholder="Search by actor name, country, or style..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:border-primary outline-none"
                autoFocus
              />
            </div>

            {/* Modal Voice List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[420px] scrollbar-thin">
              {modalFilteredVoices.map((voice) => {
                const isSelected = voice.id === selectedVoiceId;
                const isClonedVoice = voice.tags.includes("Cloned Voice");

                return (
                  <div
                    key={voice.id}
                    onClick={() => {
                      setSelectedVoiceId(voice.id);
                      setIsModalOpen(false);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-primary/15 border-primary shadow-sm"
                        : "bg-background/60 border-border/50 hover:bg-muted/50 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                          isClonedVoice
                            ? "bg-gradient-to-tr from-primary to-accent text-white"
                            : "bg-primary/20 text-primary"
                        }`}
                      >
                        {voice.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-foreground">
                            {voice.name}
                          </span>
                          {isClonedVoice ? (
                            <Badge variant="glow" size="sm">
                              Cloned
                            </Badge>
                          ) : (
                            <Badge variant="secondary" size="sm">
                              {voice.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {voice.languageName} • {voice.gender}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleTogglePreview(e, voice)}
                        className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground text-xs"
                        title="Listen to sample"
                      >
                        ▶
                      </button>
                      <Button size="sm" variant={isSelected ? "primary" : "outline"}>
                        {isSelected ? "Selected" : "Select"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-border/60 bg-card/60 flex items-center justify-between text-xs">
              <Link href="/dashboard/voices" onClick={() => setIsModalOpen(false)} className="text-primary hover:underline">
                Open Full Voice Library Catalog (100+ Actors) →
              </Link>
              <Button size="sm" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
