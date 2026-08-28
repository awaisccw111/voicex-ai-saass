import { create } from "zustand";
import toast from "react-hot-toast";
import { trackEvent } from "@/lib/analytics";
import { captureException } from "@/lib/sentry";

export type GenerationStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface VoiceGenerationItem {
  readonly id: string;
  readonly status: GenerationStatus;
  readonly text: string;
  readonly voiceId: string;
  readonly audioUrl?: string | null | undefined;
  readonly duration?: number | null | undefined;
  readonly cost?: number | null | undefined;
  readonly creditsUsed: number;
  readonly format: string;
  readonly errorMessage?: string | null | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StudioState {
  readonly promptText: string;
  readonly selectedVoiceId: string;
  readonly selectedFormat: "mp3" | "wav" | "ogg";
  readonly speed: number;
  readonly pitch: number;
  readonly isGenerating: boolean;
  readonly isLoadingHistory: boolean;
  readonly generations: readonly VoiceGenerationItem[];
  readonly activeAudioId: string | null;
  readonly isPlaying: boolean;

  // Actions
  readonly setPromptText: (text: string) => void;
  readonly setSelectedVoiceId: (id: string) => void;
  readonly setSelectedFormat: (format: "mp3" | "wav" | "ogg") => void;
  readonly setSpeed: (speed: number) => void;
  readonly setPitch: (pitch: number) => void;
  readonly setActiveAudioId: (id: string | null) => void;
  readonly setIsPlaying: (isPlaying: boolean) => void;
  readonly fetchGenerations: () => Promise<void>;
  readonly submitGeneration: (onSuccess?: (creditsRemaining: number) => void) => Promise<void>;
  readonly pollJobStatus: (generationId: string) => void;
}

const INITIAL_STUDIO_PROMPT =
  "In a world where intelligence meets acoustic elegance, synthetic speech transcends the boundary between human emotion and neural precision.";

import { DEFAULT_VOICE_ID } from "@saas/core";

export const useStudioStore = create<StudioState>((set, get) => ({
  promptText: INITIAL_STUDIO_PROMPT,
  selectedVoiceId: DEFAULT_VOICE_ID,
  selectedFormat: "mp3",
  speed: 1.0,
  pitch: 0,
  isGenerating: false,
  isLoadingHistory: false,
  generations: [],
  activeAudioId: null,
  isPlaying: false,

  setPromptText: (text) => set({ promptText: text.slice(0, 1000) }),
  setSelectedVoiceId: (id) => set({ selectedVoiceId: id }),
  setSelectedFormat: (format) => set({ selectedFormat: format }),
  setSpeed: (speed) => set({ speed }),
  setPitch: (pitch) => set({ pitch }),
  setActiveAudioId: (id) => set({ activeAudioId: id }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),

  fetchGenerations: async () => {
    set({ isLoadingHistory: true });
    try {
      const response = await fetch("/api/generations");
      const result = await response.json();
      if (response.ok && result.success && Array.isArray(result.data)) {
        set({ generations: result.data });

        // Auto-resume polling for any active in-flight jobs
        result.data.forEach((gen: VoiceGenerationItem) => {
          if (gen.status === "PENDING" || gen.status === "PROCESSING") {
            get().pollJobStatus(gen.id);
          }
        });
      }
    } catch {
      // Ignore initial load network error
    } finally {
      set({ isLoadingHistory: false });
    }
  },

  submitGeneration: async (onSuccess) => {
    const { promptText, selectedVoiceId, selectedFormat, speed, pitch, isGenerating } = get();

    if (isGenerating) return;

    if (!promptText.trim()) {
      toast.error("Please enter a voice script before synthesizing.");
      return;
    }

    if (promptText.length > 1000) {
      toast.error("Script exceeds the maximum limit of 1,000 characters.");
      return;
    }

    set({ isGenerating: true });
    const toastId = toast.loading("Enqueuing voice generation job...");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: promptText,
          voiceId: selectedVoiceId,
          format: selectedFormat,
          speed,
          pitch,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMsg = result.error?.message ?? "Generation request failed.";
        toast.error(errorMsg, { id: toastId });
        set({ isGenerating: false });
        return;
      }

      const isInstantComplete = result.data.status === "COMPLETED";

      const newGenItem: VoiceGenerationItem = {
        id: result.data.generationId,
        status: isInstantComplete ? "COMPLETED" : "PENDING",
        text: promptText,
        voiceId: selectedVoiceId,
        audioUrl: result.data.audioUrl ?? null,
        duration: result.data.durationSeconds ?? null,
        creditsUsed: result.data.creditsDeducted,
        format: selectedFormat,
        createdAt: result.data.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to front of generations list
      set((state) => ({
        generations: [newGenItem, ...state.generations],
        isGenerating: false,
      }));

      if (isInstantComplete) {
        toast.success("Voice generation completed!", { id: toastId });
      } else {
        toast.success("Job submitted! Synthesizing audio...", { id: toastId });
        // Start polling for async job resolution
        get().pollJobStatus(newGenItem.id);
      }

      if (onSuccess && typeof result.data.creditsRemaining === "number") {
        onSuccess(result.data.creditsRemaining);
      }
    } catch {
      toast.error("Network error submitting generation job.", { id: toastId });
      set({ isGenerating: false });
    }
  },

  pollJobStatus: (generationId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/generate/${generationId}`);
        const result = await response.json();

        if (response.ok && result.success && result.data) {
          const updated = result.data as VoiceGenerationItem;

          set((state) => ({
            generations: state.generations.map((g) =>
              g.id === generationId ? { ...g, ...updated } : g,
            ),
          }));

          if (updated.status === "COMPLETED") {
            clearInterval(pollInterval);
            toast.success("Voice generation completed!");
            trackEvent("voice_generation_completed", {
              generationId: updated.id,
              duration: updated.duration ?? 0,
            });
          } else if (updated.status === "FAILED") {
            clearInterval(pollInterval);
            toast.error(
              `Generation failed: ${updated.errorMessage ?? "Error occurred"}. Credits refunded.`,
            );
            trackEvent("voice_generation_failed", {
              generationId: updated.id,
              error: updated.errorMessage ?? "Unknown error",
            });
            captureException(new Error(updated.errorMessage ?? "Voice generation job failed"), {
              extra: { generationId: updated.id },
            });
          }
        }
      } catch {
        // Continue polling on transient network error
      }
    }, 1500);

    // Timeout polling after 2 minutes safety cap
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 120000);
  },
}));
