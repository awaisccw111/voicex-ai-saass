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
import {
  useVoiceStudioStore,
  PRESET_VOICES,
  formatDuration,
} from "@saas/core";
import type { VoiceEmotion } from "@saas/types";

const EMOTION_OPTIONS: readonly { value: VoiceEmotion; label: string; icon: string; pitch: number; rate: number }[] = [
  { value: "neutral", label: "Natural Neutral", icon: "🎙️", pitch: 1.0, rate: 1.0 },
  { value: "empathetic", label: "Empathetic", icon: "✨", pitch: 1.1, rate: 0.95 },
  { value: "authoritative", label: "Authoritative", icon: "🏛️", pitch: 0.85, rate: 0.9 },
  { value: "cheerful", label: "Cheerful & Warm", icon: "☀️", pitch: 1.25, rate: 1.1 },
  { value: "whispering", label: "Intimate Whisper", icon: "🤫", pitch: 0.75, rate: 0.8 },
  { value: "dramatic", label: "Cinematic Dramatic", icon: "🎭", pitch: 0.9, rate: 0.85 },
];

/** Helper to generate a downloadable WAV audio file from speech tone */
function createSyntheticWavBlob(text: string, durationSeconds: number): Blob {
  const sampleRate = 44100;
  const numSamples = Math.max(sampleRate * durationSeconds, sampleRate);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // PCM format chunk size
  view.setUint16(20, 1, true); // Audio format 1 (PCM)
  view.setUint16(22, 1, true); // 1 Channel (Mono)
  view.setUint32(24, sampleRate, true); // Sample rate
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // 16-bit
  writeString(36, "data");
  view.setUint32(40, numSamples * 2, true);

  // Generate synthetic melodic audio waveform corresponding to text speech
  const baseFreq = 220 + (text.length % 50) * 4;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.sin(Math.min(Math.PI, (t / durationSeconds) * Math.PI));
    const sample = Math.sin(2 * Math.PI * baseFreq * t) * envelope * 0.4;
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export const VoiceDemoStudio: React.FC = () => {
  const {
    selectedVoiceId,
    promptText,
    selectedEmotion,
    settings,
    status,
    isPlaying,
    activeClip,
    history,
    setSelectedVoiceId,
    setPromptText,
    setSelectedEmotion,
    updateSettings,
    setIsPlaying,
    generateSpeechMock,
  } = useVoiceStudioStore();

  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);

  const selectedVoice =
    PRESET_VOICES.find((v) => v.id === selectedVoiceId) ?? PRESET_VOICES[0]!;

  const playSpeechAudio = React.useCallback(
    (textToSpeak: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setIsPlaying(true);
        setTimeout(() => setIsPlaying(false), 3000);
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(textToSpeak || "Welcome to Voicex AI.");
      const emotionConfig = EMOTION_OPTIONS.find((e) => e.value === selectedEmotion);

      // Configure pitch, rate, and voice actor
      utterance.pitch = (emotionConfig?.pitch ?? 1.0) * settings.stability;
      utterance.rate = (emotionConfig?.rate ?? 1.0) * settings.speed;

      // Match system voices to actor gender/locale if possible
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        const isBritish = selectedVoice.category.toLowerCase().includes("british");
        const matchingVoice = availableVoices.find(
          (v) => (isBritish ? v.lang.includes("GB") || v.lang.includes("en-GB") : v.lang.includes("en"))
        );
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      utterance.onstart = () => {
        setIsPlaying(true);
      };

      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [selectedEmotion, settings.stability, settings.speed, selectedVoice, setIsPlaying]
  );

  const handleGenerate = async () => {
    try {
      await generateSpeechMock();
      playSpeechAudio(promptText);
    } catch {
      // Handled in store
    }
  };

  const handlePlayToggle = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        playSpeechAudio(promptText || (activeClip?.text ?? ""));
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    const textToExport = promptText || (activeClip?.text ?? "Voicex Audio Export");
    const duration = activeClip?.durationSeconds ?? Math.max(2, Math.round(textToExport.length / 15));
    const wavBlob = createSyntheticWavBlob(textToExport, duration);

    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voicex-${selectedVoice.name.toLowerCase().replace(/\s+/g, "-")}-preview.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div id="demo" className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Voice Selector & Fine Tuning */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Voice Model Selector Card */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>1. Neural Voice Profile</CardTitle>
                  <CardDescription>
                    Select an ultra-realistic vocal actor model
                  </CardDescription>
                </div>
                <Badge variant="primary" size="sm">
                  {PRESET_VOICES.length} Models Ready
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2.5">
                {PRESET_VOICES.map((voice) => {
                  const isSelected = voice.id === selectedVoiceId;
                  return (
                    <button
                      key={voice.id}
                      type="button"
                      onClick={() => setSelectedVoiceId(voice.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-center justify-between group ${
                        isSelected
                          ? "bg-primary/10 border-primary shadow-glow text-foreground"
                          : "bg-background/40 border-border/60 hover:border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground group-hover:bg-primary/20"
                          }`}
                        >
                          {voice.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">
                              {voice.name}
                            </span>
                            {voice.isPremium && (
                              <Badge variant="glow" size="sm">
                                HD
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {voice.languageName} • {voice.category}
                          </p>
                        </div>
                      </div>

                      {/* Tag preview */}
                      <div className="hidden sm:flex items-center gap-1">
                        {voice.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Acoustic Fine-Tuning Parameters */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle>2. Acoustic Cadence & Pitch</CardTitle>
              <CardDescription>Fine-tune stability and delivery speed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-foreground mb-1.5">
                  <span>Stability ({Math.round(settings.stability * 100)}%)</span>
                  <span className="text-muted-foreground">More Human ↔ More Consistent</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={settings.stability}
                  onChange={(e) => updateSettings({ stability: parseFloat(e.target.value) })}
                  className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-foreground mb-1.5">
                  <span>Speed Multiplier ({settings.speed}x)</span>
                  <span className="text-muted-foreground">0.5x ↔ 2.0x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.75"
                  step="0.05"
                  value={settings.speed}
                  onChange={(e) => updateSettings({ speed: parseFloat(e.target.value) })}
                  className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Interactive Prompt & Real-time Synthesis */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <Card className="border-border/60 bg-card/80 backdrop-blur-md shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>3. Speech Script & Style</CardTitle>
                  <CardDescription>
                    Enter text and pick an emotional delivery contour
                  </CardDescription>
                </div>
                <Badge variant="outline" size="sm">
                  {promptText.length} characters
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Emotion Selector Pills */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Delivery Style</label>
                <div className="flex flex-wrap gap-2">
                  {EMOTION_OPTIONS.map((emo) => {
                    const isSelected = selectedEmotion === emo.value;
                    return (
                      <button
                        key={emo.value}
                        type="button"
                        onClick={() => setSelectedEmotion(emo.value)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-150 flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background/60 text-muted-foreground border-border/80 hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <span>{emo.icon}</span>
                        <span>{emo.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text Input Area */}
              <div className="space-y-1.5">
                <label htmlFor="prompt-script" className="text-xs font-medium text-foreground">
                  Voiceover Script
                </label>
                <textarea
                  id="prompt-script"
                  rows={4}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Enter the voice script you want synthesized into studio speech..."
                  className="w-full rounded-xl border border-border bg-background/90 p-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none font-sans leading-relaxed"
                />
              </div>

              {/* Audio Playback & Waveform Canvas */}
              <div className="p-4 rounded-xl border border-border/60 bg-background/50 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {activeClip ? "Generated Audio Preview" : "Acoustic Output Ready"}
                    </span>
                    {activeClip && (
                      <Badge variant="success" size="sm">
                        24-bit / 48kHz WAV
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {activeClip ? formatDuration(activeClip.durationSeconds) : "0:00"}
                  </span>
                </div>

                {/* Animated Soundwave Visualizer Bars */}
                <div className="h-14 bg-card/60 rounded-lg border border-border/40 p-2 flex items-center justify-center gap-1 overflow-hidden relative">
                  {status === "processing" ? (
                    <div className="flex items-center gap-2 text-primary text-xs font-medium animate-pulse">
                      <span>Synthesizing acoustic tensors...</span>
                    </div>
                  ) : (
                    Array.from({ length: 36 }).map((_, idx) => {
                      const heights = [
                        20, 35, 55, 75, 40, 60, 85, 95, 65, 45, 80, 100, 70, 50, 90, 60, 40, 80,
                        95, 70, 45, 65, 85, 50, 35, 75, 90, 60, 40, 70, 55, 30, 45, 60, 35, 20,
                      ];
                      const height = heights[idx % heights.length] ?? 30;
                      return (
                        <div
                          key={idx}
                          className={`w-1.5 rounded-full transition-all duration-300 ${
                            isPlaying
                              ? `bg-gradient-to-t from-primary to-accent audio-bar-${(idx % 5) + 1}`
                              : activeClip
                              ? "bg-primary/50"
                              : "bg-muted-foreground/20"
                          }`}
                          style={{
                            height: isPlaying ? undefined : `${height}%`,
                          }}
                        />
                      );
                    })
                  )}
                </div>

                {/* Audio Controls */}
                {activeClip && (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handlePlayToggle}
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
                        {isPlaying ? "Pause" : "Play Clip"}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Voice: {selectedVoice.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownload}
                      className="text-xs text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Download WAV</span>
                    </button>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground text-center sm:text-left">
                <span>Free Tier: 10,000 characters/mo remaining</span>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={handleGenerate}
                isLoading={status === "processing"}
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
                Synthesize Speech
              </Button>
            </CardFooter>
          </Card>

          {/* Generation History List */}
          {history.length > 0 && (
            <Card className="border-border/60 bg-card/40">
              <CardHeader>
                <CardTitle className="text-base">Recent Studio Syntheses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {history.map((clip) => {
                  const clipVoice = PRESET_VOICES.find((v) => v.id === clip.voiceId);
                  return (
                    <div
                      key={clip.id}
                      className="p-3 rounded-lg border border-border/40 bg-background/40 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="font-semibold text-foreground">
                          {clipVoice?.name ?? "Voice"}
                        </span>
                        <span className="text-muted-foreground truncate max-w-xs">
                          {clip.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="default" size="sm">
                          {formatDuration(clip.durationSeconds)}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {clip.emotion}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
