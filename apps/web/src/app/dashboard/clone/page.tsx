"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
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

interface ClonedVoiceItem {
  readonly id: string;
  readonly fishAudioId: string;
  readonly name: string;
  readonly gender: string;
  readonly language: string;
  readonly description?: string | null;
  readonly createdAt: string;
}

export default function VoiceCloningPage() {
  const router = useRouter();

  const [voiceName, setVoiceName] = React.useState("");
  const [language, setLanguage] = React.useState("en-US");
  const [gender, setGender] = React.useState("neutral");
  const [description, setDescription] = React.useState("");

  // Recording State
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingSeconds, setRecordingSeconds] = React.useState(0);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [activeTab, setActiveTab] = React.useState<"record" | "upload">("record");

  // Vault state
  const [isCloning, setIsCloning] = React.useState(false);
  const [clonedVoices, setClonedVoices] = React.useState<readonly ClonedVoiceItem[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = React.useState(true);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Fetch existing cloned voices
  const fetchClonedVoices = React.useCallback(async () => {
    try {
      setIsLoadingVoices(true);
      const res = await fetch("/api/clone");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setClonedVoices(data.data);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoadingVoices(false);
    }
  }, []);

  React.useEffect(() => {
    fetchClonedVoices();
  }, [fetchClonedVoices]);

  // Start Mic Recording
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error("Microphone access denied. Please allow microphone permissions.");
    }
  };

  // Stop Mic Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      if (!voiceName) {
        setVoiceName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  // Submit Voice Cloning
  const handleCloneSubmit = async () => {
    if (!voiceName.trim()) {
      toast.error("Please enter a name for your custom cloned voice.");
      return;
    }

    if (!audioBlob && !selectedFile) {
      toast.error("Please record or upload an audio sample first.");
      return;
    }

    setIsCloning(true);
    const toastId = toast.loading("Synthesizing voice acoustic tensors...");

    try {
      const formData = new FormData();
      formData.append("name", voiceName);
      formData.append("language", language);
      formData.append("gender", gender);
      formData.append("description", description);

      if (selectedFile) {
        formData.append("audio", selectedFile);
      } else if (audioBlob) {
        formData.append("audio", audioBlob, "recording.wav");
      }

      const res = await fetch("/api/clone", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        toast.error(result.error?.message ?? "Voice cloning failed.", { id: toastId });
        setIsCloning(false);
        return;
      }

      toast.success(`Voice "${voiceName}" cloned successfully! 50 Credits deducted.`, {
        id: toastId,
      });

      // Reset form
      setVoiceName("");
      setDescription("");
      setAudioBlob(null);
      setAudioUrl(null);
      setSelectedFile(null);
      setRecordingSeconds(0);

      // Refresh list
      await fetchClonedVoices();
    } catch {
      toast.error("Network error during voice cloning.", { id: toastId });
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Zero-Shot AI Voice Cloning
            </h1>
            <Badge variant="glow" size="sm">
              Fish Audio S2.1 Pro
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Clone any human voice with 10–30 seconds of audio. Generate your custom neural model in 83 languages.
          </p>
        </div>

        <Link href="/dashboard/studio">
          <Button variant="outline" size="md">
            Open Studio Workspace →
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Voice Cloning Form */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-border/60 bg-card/70 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle>1. Audio Source Sample</CardTitle>
              <CardDescription>
                Record your voice directly or upload a clean voice audio clip (10–60 seconds recommended).
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Tab Selector */}
              <div className="flex rounded-xl p-1 bg-background/80 border border-border/60">
                <button
                  type="button"
                  onClick={() => setActiveTab("record")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === "record"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"
                    />
                  </svg>
                  <span>Record Microphone</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("upload")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === "upload"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  <span>Upload File (MP3/WAV)</span>
                </button>
              </div>

              {/* Record Tab */}
              {activeTab === "record" && (
                <div className="p-6 rounded-2xl border border-dashed border-border/80 bg-background/40 flex flex-col items-center justify-center text-center space-y-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                      isRecording
                        ? "bg-destructive text-white animate-pulse shadow-lg ring-8 ring-destructive/20"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"
                      />
                    </svg>
                  </div>

                  <div>
                    {isRecording ? (
                      <p className="text-sm font-semibold text-destructive">
                        Recording in progress... {recordingSeconds}s
                      </p>
                    ) : audioBlob ? (
                      <p className="text-sm font-semibold text-success">
                        Audio sample recorded ({recordingSeconds}s)
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Click below to start recording. Speak naturally in a quiet room.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {isRecording ? (
                      <Button variant="destructive" size="md" onClick={stopRecording}>
                        ⏹ Stop Recording
                      </Button>
                    ) : (
                      <Button variant="primary" size="md" onClick={startRecording}>
                        🎙️ Start Recording
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Upload Tab */}
              {activeTab === "upload" && (
                <div className="p-6 rounded-2xl border border-dashed border-border/80 bg-background/40 flex flex-col items-center justify-center text-center space-y-3">
                  <input
                    type="file"
                    id="voice-upload"
                    accept="audio/mp3,audio/wav,audio/m4a,audio/webm,audio/ogg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="voice-upload"
                    className="cursor-pointer flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {selectedFile ? selectedFile.name : "Click to select audio file"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Supports MP3, WAV, M4A, WEBM (Max 25MB)
                    </span>
                  </label>
                </div>
              )}

              {/* Audio Preview Player */}
              {audioUrl && (
                <div className="p-3 rounded-xl bg-background/60 border border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">Sample Preview:</span>
                    <audio src={audioUrl} controls className="h-8 max-w-[240px]" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAudioBlob(null);
                      setAudioUrl(null);
                      setSelectedFile(null);
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Voice Profile Metadata */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1.5">
                    Cloned Voice Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. My Podcast Voice, Awais Custom..."
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:border-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1.5">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:border-primary outline-none"
                    >
                      <option value="en-US">English (United States) 🇺🇸</option>
                      <option value="en-GB">English (United Kingdom) 🇬🇧</option>
                      <option value="hi-IN">Hindi (India) 🇮🇳</option>
                      <option value="ur-PK">Urdu (Pakistan) 🇵🇰</option>
                      <option value="es-ES">Spanish (Spain) 🇪🇸</option>
                      <option value="fr-FR">French (France) 🇫🇷</option>
                      <option value="de-DE">German (Germany) 🇩🇪</option>
                      <option value="ar-SA">Arabic (Saudi Arabia) 🇸🇦</option>
                      <option value="ja-JP">Japanese (Japan) 🇯🇵</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1.5">
                      Gender Tone
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:border-primary outline-none"
                    >
                      <option value="neutral">Neutral</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1.5">
                    Description / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Warm conversational tone for YouTube videos"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:border-primary outline-none"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-border/40 p-6 bg-card/40">
              <div className="text-xs text-muted-foreground">
                <span>Cost: </span>
                <span className="font-bold text-primary font-mono text-sm">50 Credits</span>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleCloneSubmit}
                disabled={isCloning || (!audioBlob && !selectedFile)}
                isLoading={isCloning}
              >
                ✨ Clone Voice Model
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Cloned Voices Vault */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              My Cloned Voices Vault
            </h2>
            <Badge variant="secondary" size="sm">
              {clonedVoices.length} Models
            </Badge>
          </div>

          {isLoadingVoices && (
            <div className="p-8 rounded-xl border border-border/60 bg-card/40 text-center animate-pulse">
              <p className="text-xs text-muted-foreground">Loading your custom voice models...</p>
            </div>
          )}

          {!isLoadingVoices && clonedVoices.length === 0 && (
            <Card className="border-dashed border-border/80 bg-card/30 p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="font-semibold text-sm text-foreground">No Cloned Voices Yet</h3>
              <p className="text-xs text-muted-foreground">
                Record or upload your audio on the left to clone your first custom voice model.
              </p>
            </Card>
          )}

          <div className="space-y-3">
            {clonedVoices.map((voice) => (
              <Card
                key={voice.id}
                className="border-border/60 bg-card/70 backdrop-blur-md p-4 space-y-3 hover:border-primary/60 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/30 to-accent/30 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {voice.name.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{voice.name}</h4>
                      <p className="text-[11px] text-muted-foreground">
                        {voice.language} • {voice.gender}
                      </p>
                    </div>
                  </div>

                  <Badge variant="glow" size="sm">
                    Custom Model
                  </Badge>
                </div>

                {voice.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {voice.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <code className="text-[10px] text-primary font-mono truncate max-w-[140px]">
                    {voice.fishAudioId}
                  </code>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => router.push(`/dashboard/studio?voiceId=${voice.fishAudioId}`)}
                  >
                    Use in Studio →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
