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
  const [filterCategory, setFilterCategory] = React.useState<string>("all");
  const [filterLanguage, setFilterLanguage] = React.useState<string>("all");
  const [customVoices, setCustomVoices] = React.useState<readonly VoiceModel[]>([]);

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

  const availableLanguages = React.useMemo(() => {
    const langs = new Map<string, string>();
    allVoices.forEach((v) => langs.set(v.language, v.languageName));
    return Array.from(langs.entries());
  }, [allVoices]);

  const filteredVoices = React.useMemo(() => {
    return allVoices.filter((voice) => {
      const matchCat = filterCategory === "all" || voice.category.toLowerCase() === filterCategory.toLowerCase();
      const matchLang = filterLanguage === "all" || voice.language === filterLanguage;
      return matchCat && matchLang;
    });
  }, [allVoices, filterCategory, filterLanguage]);

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

  return (
    <div className="space-y-4">
      {/* Header & Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
            Select AI Voice Actor
          </label>
          <span className="text-xs text-muted-foreground">
            {filteredVoices.length} of {allVoices.length} voices available
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/clone">
            <Button variant="primary" size="sm" className="text-xs">
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

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <select
          value={filterLanguage}
          onChange={(e) => setFilterLanguage(e.target.value)}
          className="h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:border-primary outline-none"
        >
          <option value="all">All Languages / Regions</option>
          {availableLanguages.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:border-primary outline-none"
        >
          <option value="all">All Styles</option>
          <option value="narrative">Narrative</option>
          <option value="commercial">Commercial</option>
          <option value="conversational">Conversational</option>
          <option value="gaming">Gaming & Anime</option>
          <option value="meditation">Meditation</option>
          <option value="executive">Corporate / Executive</option>
        </select>

        {(filterCategory !== "all" || filterLanguage !== "all") && (
          <button
            type="button"
            onClick={() => {
              setFilterCategory("all");
              setFilterLanguage("all");
            }}
            className="text-primary hover:underline text-xs ml-auto"
          >
            Reset
          </button>
        )}
      </div>

      {/* Voice Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
        {filteredVoices.map((voice) => {
          const isSelected = voice.id === selectedVoiceId;
          const isPreviewing = playingPreviewId === voice.id;
          const isCloned = voice.tags.includes("Cloned Voice");

          return (
            <div
              key={voice.id}
              onClick={() => setSelectedVoiceId(voice.id)}
              className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5 text-left group select-none ${
                isSelected
                  ? "bg-primary/10 border-primary shadow-glow text-foreground ring-1 ring-primary/40"
                  : "bg-card/60 border-border/60 hover:border-border hover:bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 transition-colors ${
                      isCloned
                        ? "bg-gradient-to-tr from-primary to-accent text-white"
                        : isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground group-hover:bg-primary/20"
                    }`}
                  >
                    {voice.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>

                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {voice.name}
                      </span>
                      {isCloned ? (
                        <Badge variant="glow" size="sm">
                          Cloned
                        </Badge>
                      ) : voice.isPremium && (
                        <Badge variant="glow" size="sm">
                          HD
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {voice.languageName}
                    </p>
                  </div>
                </div>

                {/* Sample Preview Play Button */}
                <button
                  type="button"
                  onClick={(e) => handleTogglePreview(e, voice)}
                  title="Listen to sample audio"
                  className={`p-1.5 rounded-lg border text-xs transition-colors shrink-0 ${
                    isPreviewing
                      ? "bg-primary text-primary-foreground border-primary animate-pulse"
                      : "bg-background/80 text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {isPreviewing ? (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Tag Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/70 text-muted-foreground capitalize">
                  {voice.category}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground capitalize">
                  {voice.gender}
                </span>
                {voice.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-background/60 text-muted-foreground border border-border/40"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
