"use client";

import * as React from "react";
import toast from "react-hot-toast";

interface GenerationItem {
  id: string;
  text: string;
  voiceId: string;
  status: string;
  audioUrl?: string | null;
  duration?: number | null;
  creditsUsed: number;
  format: string;
  errorMessage?: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    tier: string;
  };
}

export default function GenerationsAuditPage() {
  const [generations, setGenerations] = React.useState<readonly GenerationItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const fetchGenerations = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/generations?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setGenerations(json.data);
      }
    } catch {
      toast.error("Failed to load generations");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const handlePlayToggle = (gen: GenerationItem) => {
    if (!gen.audioUrl) return;

    if (playingId === gen.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(gen.audioUrl);
    audioRef.current = audio;
    audio.play();
    setPlayingId(gen.id);

    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Speech Synthesis Generations Audit
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Audit speech synthesis jobs, review user prompt scripts, monitor failure rates, and listen to generated audio clips.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed (Refunded)</option>
            <option value="PROCESSING">Processing</option>
            <option value="PENDING">Pending</option>
          </select>

          <button
            type="button"
            onClick={fetchGenerations}
            className="px-3 py-1.5 rounded-lg border border-border/80 bg-background/80 hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Generations Table */}
      <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-background/80 border-b border-border/60 text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Script Text</th>
                <th className="p-4">Voice Model ID</th>
                <th className="p-4">Credits</th>
                <th className="p-4">Status & Audio</th>
                <th className="p-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground animate-pulse">
                    Loading voiceover jobs from Azure PostgreSQL...
                  </td>
                </tr>
              )}

              {!isLoading && generations.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No generation records found.
                  </td>
                </tr>
              )}

              {generations.map((gen) => (
                <tr key={gen.id} className="hover:bg-muted/30 transition-colors">
                  {/* User */}
                  <td className="p-4 whitespace-nowrap">
                    <div className="font-bold text-foreground">{gen.user.name || "User"}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{gen.user.email}</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase font-semibold">
                      {gen.user.tier}
                    </span>
                  </td>

                  {/* Text */}
                  <td className="p-4 max-w-md">
                    <p className="line-clamp-2 text-foreground/90 italic leading-relaxed">
                      &ldquo;{gen.text}&rdquo;
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {gen.text.length} chars • {gen.format.toUpperCase()}
                    </span>
                  </td>

                  {/* Voice Model */}
                  <td className="p-4">
                    <code className="text-[11px] font-mono text-primary truncate max-w-[120px] block">
                      {gen.voiceId.slice(0, 16)}...
                    </code>
                  </td>

                  {/* Credits */}
                  <td className="p-4">
                    <span className="font-extrabold font-mono text-sm text-foreground">
                      {gen.creditsUsed}
                    </span>
                  </td>

                  {/* Status & Player */}
                  <td className="p-4 space-y-1">
                    <div>
                      {gen.status === "COMPLETED" ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                          Ready ({gen.duration ? `${gen.duration}s` : "0s"})
                        </span>
                      ) : gen.status === "FAILED" ? (
                        <span className="px-2 py-0.5 rounded bg-destructive/15 text-destructive font-bold text-[10px]">
                          Failed (Refunded)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold text-[10px]">
                          {gen.status}
                        </span>
                      )}
                    </div>

                    {gen.audioUrl && (
                      <button
                        type="button"
                        onClick={() => handlePlayToggle(gen)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all ${
                          playingId === gen.id
                            ? "bg-primary text-primary-foreground animate-pulse"
                            : "bg-background border border-border/80 text-foreground hover:bg-muted"
                        }`}
                      >
                        {playingId === gen.id ? "⏹ Pause" : "▶ Play Audio"}
                      </button>
                    )}
                  </td>

                  {/* Timestamp */}
                  <td className="p-4 text-right whitespace-nowrap text-[11px] text-muted-foreground">
                    {new Date(gen.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
