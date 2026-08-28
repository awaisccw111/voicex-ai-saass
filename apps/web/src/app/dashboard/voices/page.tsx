"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
} from "@saas/ui";
import { PRESET_VOICES } from "@saas/core";
import type { VoiceModel } from "@saas/types";

export default function VoiceLibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedGender, setSelectedGender] = React.useState<string>("all");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>("all");
  const [playingVoiceId, setPlayingVoiceId] = React.useState<string | null>(null);

  // Extract unique languages & categories
  const languages = React.useMemo(() => {
    const langs = new Map<string, string>();
    PRESET_VOICES.forEach((v) => {
      langs.set(v.language, v.languageName);
    });
    return Array.from(langs.entries());
  }, []);

  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    PRESET_VOICES.forEach((v) => cats.add(v.category));
    return Array.from(cats);
  }, []);

  // Filtered Voices
  const filteredVoices = React.useMemo(() => {
    return PRESET_VOICES.filter((voice) => {
      // Search match
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        voice.name.toLowerCase().includes(query) ||
        voice.languageName.toLowerCase().includes(query) ||
        voice.tags.some((t) => t.toLowerCase().includes(query));

      // Gender match
      const matchesGender =
        selectedGender === "all" || voice.gender.toLowerCase() === selectedGender.toLowerCase();

      // Category match
      const matchesCategory =
        selectedCategory === "all" ||
        voice.category.toLowerCase() === selectedCategory.toLowerCase();

      // Language match
      const matchesLanguage =
        selectedLanguage === "all" || voice.language === selectedLanguage;

      return matchesSearch && matchesGender && matchesCategory && matchesLanguage;
    });
  }, [searchQuery, selectedGender, selectedCategory, selectedLanguage]);

  // Audio Playback Simulation
  const handlePlayPreview = (voice: VoiceModel) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (playingVoiceId === voice.id) {
        window.speechSynthesis.cancel();
        setPlayingVoiceId(null);
        return;
      }

      window.speechSynthesis.cancel();
      setPlayingVoiceId(voice.id);

      const sampleText = `Hello, I'm ${voice.name}. I can narrate your stories, commercial promos, and podcast voiceovers with studio acoustic quality.`;
      const utterance = new SpeechSynthesisUtterance(sampleText);

      // Attempt to match voice
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) =>
        v.lang.toLowerCase().includes(voice.language.slice(0, 2).toLowerCase()),
      );
      if (match) utterance.voice = match;

      utterance.onend = () => setPlayingVoiceId(null);
      utterance.onerror = () => setPlayingVoiceId(null);

      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingVoiceId(voice.id);
      setTimeout(() => setPlayingVoiceId(null), 3000);
    }
  };

  const handleSelectAndUse = (voice: VoiceModel) => {
    router.push(`/dashboard/studio?voiceId=${voice.id}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Neural Voice Actor Catalog
            </h1>
            <Badge variant="glow" size="sm">
              {PRESET_VOICES.length} Actors Available
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Browse our global library of studio-grade voice actors, filter by language or delivery style, and test real-time sample acoustics.
          </p>
        </div>

        <Link href="/dashboard/studio">
          <Button variant="primary" size="md">
            Open Voiceover Studio →
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-md p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Search by Name / Keyword
            </label>
            <input
              type="text"
              placeholder="Search e.g. Aurora, British, Deep..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background/90 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Language & Country Dropdown */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Language & Region
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background/90 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            >
              <option value="all">All Languages & Countries ({languages.length}+)</option>
              {languages.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Gender
            </label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background/90 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            >
              <option value="all">All Genders</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Style / Use Case
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background/90 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            >
              <option value="all">All Styles</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Quick Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40 text-xs">
          <span className="text-muted-foreground font-medium">Quick Styles:</span>
          {["narrative", "commercial", "gaming", "meditation", "executive", "conversational"].map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(selectedCategory === cat ? "all" : cat)}
                className={`px-2.5 py-1 rounded-full border transition-all ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/70"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ),
          )}
          {filteredVoices.length !== PRESET_VOICES.length && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedGender("all");
                setSelectedCategory("all");
                setSelectedLanguage("all");
              }}
              className="text-primary hover:underline ml-auto"
            >
              Reset Filters ({filteredVoices.length} results)
            </button>
          )}
        </div>
      </Card>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredVoices.map((voice) => {
          const isPlaying = playingVoiceId === voice.id;

          return (
            <Card
              key={voice.id}
              className="border-border/60 bg-card/70 backdrop-blur-md flex flex-col justify-between hover:border-primary/60 transition-all duration-200 group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary/30 to-accent/30 text-primary flex items-center justify-center font-bold text-sm uppercase shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                      {voice.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{voice.name}</CardTitle>
                        {voice.isPremium && (
                          <Badge variant="glow" size="sm">
                            HD
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {voice.languageName}
                      </p>
                    </div>
                  </div>

                  <Badge variant="secondary" size="sm" className="capitalize">
                    {voice.gender}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 py-2">
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {voice.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Acoustic Model Metadata */}
                <div className="p-3 rounded-lg bg-background/50 border border-border/40 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">
                      Fish Audio Model ID
                    </span>
                    <code className="text-primary font-mono text-[11px]">
                      {voice.id.slice(0, 16)}...
                    </code>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-success/15 text-success font-medium">
                    Latency: ~180ms
                  </span>
                </div>
              </CardContent>

              <CardFooter className="pt-3 border-t border-border/40 flex items-center justify-between gap-3">
                {/* Preview Button */}
                <Button
                  size="sm"
                  variant={isPlaying ? "primary" : "secondary"}
                  onClick={() => handlePlayPreview(voice)}
                  leftIcon={
                    isPlaying ? (
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
                  {isPlaying ? "Playing..." : "Preview Sample"}
                </Button>

                {/* Select & Use Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSelectAndUse(voice)}
                  rightIcon={
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  }
                >
                  Use in Studio
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {filteredVoices.length === 0 && (
        <div className="text-center py-16 p-8 rounded-2xl border border-border/60 bg-card/40 space-y-3">
          <p className="text-lg font-semibold text-foreground">No voice actors matched your filters</p>
          <p className="text-xs text-muted-foreground">
            Try searching for a different language or clearing your active filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedGender("all");
              setSelectedCategory("all");
              setSelectedLanguage("all");
            }}
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
