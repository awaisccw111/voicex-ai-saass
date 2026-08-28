"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
} from "@saas/ui";
import { useSearchParams } from "next/navigation";
import { VoiceSelector } from "@/components/studio/voice-selector";
import { GenerationList } from "@/components/studio/generation-list";
import { useStudioStore } from "@/store/useStudioStore";

export default function StudioPage() {
  const searchParams = useSearchParams();
  const voiceIdParam = searchParams.get("voiceId");

  const {
    promptText,
    setPromptText,
    selectedVoiceId,
    setSelectedVoiceId,
    selectedFormat,
    setSelectedFormat,
    speed,
    setSpeed,
    isGenerating,
    submitGeneration,
  } = useStudioStore();

  React.useEffect(() => {
    if (voiceIdParam && voiceIdParam !== selectedVoiceId) {
      setSelectedVoiceId(voiceIdParam);
    }
  }, [voiceIdParam, selectedVoiceId, setSelectedVoiceId]);

  const maxChars = 1000;
  const currentChars = promptText.length;
  const isOverLimit = currentChars > maxChars;
  const requiredCredits = Math.max(10, Math.ceil(currentChars / 5));

  const formatOptions: readonly ("mp3" | "wav" | "ogg")[] = ["mp3", "wav", "ogg"];

  const handleGenerateClick = () => {
    submitGeneration();
  };

  return (
    <div className="space-y-6">
      {/* Studio Header Banner */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Neural Voiceover Studio
          </h1>
          <Badge variant="glow" size="sm">
            Fish Audio S2.1 Pro
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter your script, select an actor model from 83 languages, configure cadence, and synthesize studio-quality speech.
        </p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form & Fine-Tuning */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-border/60 bg-card/80 backdrop-blur-md shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">1. Voiceover Script</CardTitle>
                  <CardDescription>
                    Type or paste the speech text you want synthesized
                  </CardDescription>
                </div>

                <div
                  className={`text-xs font-mono font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                    isOverLimit
                      ? "bg-destructive/15 text-destructive border-destructive/30 font-bold"
                      : "bg-muted text-muted-foreground border-border/60"
                  }`}
                >
                  {currentChars} / {maxChars} chars
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Script Textarea */}
              <div className="space-y-1.5">
                <textarea
                  id="studio-prompt-input"
                  rows={6}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Enter the voice script to convert into high-fidelity neural audio..."
                  className={`w-full rounded-xl border bg-background/90 p-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:ring-2 outline-none transition-all resize-none font-sans leading-relaxed ${
                    isOverLimit
                      ? "border-destructive focus:ring-destructive/20"
                      : "border-border focus:border-primary focus:ring-primary/20"
                  }`}
                />
                {isOverLimit && (
                  <p className="text-xs text-destructive font-medium">
                    Maximum limit exceeded by {currentChars - maxChars} characters.
                  </p>
                )}
              </div>

              {/* Voice Actor Selector Component */}
              <VoiceSelector />

              {/* Cadence & Audio Format Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                {/* Format Pills */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Audio Format
                  </label>
                  <div className="flex gap-2">
                    {formatOptions.map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setSelectedFormat(fmt)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold uppercase border transition-all ${
                          selectedFormat === fmt
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background/60 text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Speed Multiplier Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                    <span className="uppercase tracking-wider">Speed ({speed}x)</span>
                    <span className="text-muted-foreground text-[11px]">0.5x ↔ 1.75x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.75"
                    step="0.05"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer mt-1"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 p-6 bg-card/40">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span>Cost:</span>
                <span className="font-bold text-primary font-mono text-sm">
                  {requiredCredits} Credits
                </span>
                <span>(≈ {(requiredCredits * 0.001).toFixed(3)} USD)</span>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleGenerateClick}
                disabled={isGenerating || isOverLimit || currentChars === 0}
                isLoading={isGenerating}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                }
              >
                {isGenerating ? "Enqueuing Job..." : "Synthesize Voiceover"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Generation Queue & Audio Players */}
        <div className="lg:col-span-5">
          <GenerationList />
        </div>
      </div>
    </div>
  );
}
