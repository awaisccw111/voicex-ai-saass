"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Badge,
  Spinner,
} from "@saas/ui";
import { PRESET_VOICES, formatDuration, formatRelativeTime } from "@saas/core";
import { useStudioStore, type VoiceGenerationItem } from "@/store/useStudioStore";

export const GenerationList: React.FC = () => {
  const { generations, isLoadingHistory, fetchGenerations, activeAudioId, setActiveAudioId } =
    useStudioStore();

  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const [audioProgress, setAudioProgress] = React.useState<Record<string, number>>({});
  const audioRefs = React.useRef<Record<string, HTMLAudioElement | null>>({});

  React.useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const handlePlayToggle = (generation: VoiceGenerationItem) => {
    if (!generation.audioUrl) return;

    const currentAudio = audioRefs.current[generation.id];
    if (!currentAudio) return;

    if (playingId === generation.id) {
      currentAudio.pause();
      setPlayingId(null);
      setActiveAudioId(null);
    } else {
      // Pause any other playing audios
      Object.entries(audioRefs.current).forEach(([id, el]) => {
        if (id !== generation.id && el) {
          el.pause();
        }
      });

      currentAudio.play();
      setPlayingId(generation.id);
      setActiveAudioId(generation.id);
    }
  };

  const handleTimeUpdate = (id: string, e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audio = e.currentTarget;
    if (audio.duration) {
      const progress = (audio.currentTime / audio.duration) * 100;
      setAudioProgress((prev) => ({ ...prev, [id]: progress }));
    }
  };

  const handleAudioEnded = (id: string) => {
    setPlayingId((curr) => (curr === id ? null : curr));
    setActiveAudioId(null);
    setAudioProgress((prev) => ({ ...prev, [id]: 0 }));
  };

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
            Generation Queue & Audio Player
          </h2>
          <p className="text-xs text-muted-foreground">
            {generations.length} synthesized voice clips
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchGenerations()}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 p-1.5 rounded-lg border border-border/50 hover:bg-muted/40 transition-colors"
          title="Refresh Queue"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Scrollable Fixed Box Container */}
      <div className="flex-1 overflow-y-auto pr-1.5 space-y-3 scrollbar-thin max-h-[calc(100vh-14rem)]">
        {/* Loading Skeleton */}
        {isLoadingHistory && generations.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map((idx) => (
              <Card key={idx} className="border-border/60 bg-card/40 p-4 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
                <div className="h-3 w-full bg-muted/60 rounded mb-2" />
                <div className="h-3 w-3/4 bg-muted/40 rounded" />
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoadingHistory && generations.length === 0 && (
          <Card className="border-dashed border-border/80 bg-card/30 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-sm text-foreground">No generation jobs yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Write a script on the left and click &quot;Synthesize Voiceover&quot; to enqueue your first audio clip.
            </p>
          </Card>
        )}

        {/* Generation Queue List */}
        {generations.map((gen) => {
          const voice = PRESET_VOICES.find((v) => v.id === gen.voiceId);
          const isPlaying = playingId === gen.id;
          const progress = audioProgress[gen.id] ?? 0;

          return (
            <Card
              key={gen.id}
              className={`border transition-all duration-200 ${
                activeAudioId === gen.id
                  ? "border-primary shadow-glow bg-card/90"
                  : "border-border/60 bg-card/70 backdrop-blur-md"
              }`}
            >
              <CardHeader className="p-4 pb-2 border-none">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="font-semibold text-sm text-foreground shrink-0">
                      {voice?.name ?? gen.voiceId}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      • {gen.format.toUpperCase()}
                    </span>
                  </div>

                  {/* Real-time Status Badge */}
                  <div>
                    {gen.status === "PENDING" && (
                      <Badge variant="warning" size="sm" dot>
                        Queued
                      </Badge>
                    )}
                    {gen.status === "PROCESSING" && (
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-semibold border border-primary/30 animate-pulse">
                        <Spinner size="xs" color="primary" />
                        <span>Synthesizing</span>
                      </div>
                    )}
                    {gen.status === "COMPLETED" && (
                      <Badge variant="success" size="sm">
                        Ready {gen.duration ? `(${formatDuration(gen.duration)})` : ""}
                      </Badge>
                    )}
                    {gen.status === "FAILED" && (
                      <Badge variant="destructive" size="sm">
                        Failed (Refunded)
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-1">
                  &ldquo;{gen.text}&rdquo;
                </p>
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-3">
                {/* Error Message display */}
                {gen.status === "FAILED" && gen.errorMessage && (
                  <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                    <span>{gen.errorMessage}</span>
                  </div>
                )}

                {/* Processing Progress simulation bar */}
                {gen.status === "PROCESSING" && (
                  <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full rounded-full animate-pulse w-3/4" />
                  </div>
                )}

                {/* HTML5 Audio Player & Waveform controls for COMPLETED clips */}
                {gen.status === "COMPLETED" && gen.audioUrl && (
                  <div className="p-3 rounded-xl bg-background/60 border border-border/50 space-y-2.5">
                    {/* Hidden Native Audio Element */}
                    <audio
                      ref={(el) => {
                        audioRefs.current[gen.id] = el;
                      }}
                      src={gen.audioUrl}
                      onTimeUpdate={(e) => handleTimeUpdate(gen.id, e)}
                      onEnded={() => handleAudioEnded(gen.id)}
                      preload="metadata"
                    />

                    {/* Visual Scrubber Progress Bar */}
                    <div className="w-full bg-muted/70 rounded-full h-1.5 overflow-hidden cursor-pointer">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Player Actions & Download */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePlayToggle(gen)}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                          {isPlaying ? (
                            <>
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                              </svg>
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                              <span>Play Audio</span>
                            </>
                          )}
                        </button>

                        <span className="text-[11px] font-mono text-muted-foreground">
                          {gen.duration ? formatDuration(gen.duration) : "0:00"}
                        </span>
                      </div>

                      {/* Download Link */}
                      <a
                        href={gen.audioUrl}
                        download={`voiceover-${gen.id}.${gen.format}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg border border-border/80 hover:bg-muted/60 text-xs font-medium text-foreground transition-colors flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Footer Metadata */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                  <span>{formatRelativeTime(gen.createdAt)}</span>
                  <span>{gen.creditsUsed} Credits Used</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
