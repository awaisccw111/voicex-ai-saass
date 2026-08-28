export type VoiceGender = "male" | "female" | "neutral";

export type VoiceCategory =
  | "narrative"
  | "conversational"
  | "commercial"
  | "character"
  | "news"
  | "educational"
  | "meditation"
  | "executive"
  | "gaming"
  | "corporate";

export type VoiceLanguage =
  | "en-US"
  | "en-GB"
  | "en-AU"
  | "en-CA"
  | "en-IN"
  | "hi-IN"
  | "es-ES"
  | "es-MX"
  | "fr-FR"
  | "de-DE"
  | "ja-JP"
  | "ar-SA"
  | "ar-AE"
  | "pt-BR"
  | "it-IT"
  | (string & {});

export type VoiceEmotion =
  | "neutral"
  | "cheerful"
  | "empathetic"
  | "authoritative"
  | "whispering"
  | "excited"
  | "dramatic";

export interface VoiceModel {
  readonly id: string;
  readonly name: string;
  readonly gender: VoiceGender;
  readonly category: VoiceCategory;
  readonly language: VoiceLanguage;
  readonly languageName: string;
  readonly previewAudioUrl: string;
  readonly avatarUrl: string;
  readonly supportedEmotions: readonly VoiceEmotion[];
  readonly isPremium: boolean;
  readonly tags: readonly string[];
}

export type AudioFormat = "mp3" | "wav" | "ogg" | "flac" | "aac";

export interface VoiceSettings {
  readonly stability: number; // 0.0 to 1.0
  readonly similarityBoost: number; // 0.0 to 1.0
  readonly style: number; // 0.0 to 1.0
  readonly speed: number; // 0.5 to 2.0
  readonly pitch: number; // -12 to 12 semitones
}

export interface TTSRequest {
  readonly text: string;
  readonly voiceId: string;
  readonly emotion?: VoiceEmotion;
  readonly settings: VoiceSettings;
  readonly format: AudioFormat;
  readonly sampleRate?: number;
}

export type SynthesisStatus = "idle" | "queued" | "processing" | "completed" | "failed";

export interface TTSResponse {
  readonly synthesisId: string;
  readonly status: SynthesisStatus;
  readonly audioUrl?: string;
  readonly durationSeconds?: number;
  readonly characterCount: number;
  readonly creditsUsed: number;
  readonly createdAt: string;
  readonly error?: string;
}
