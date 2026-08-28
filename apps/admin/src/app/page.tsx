"use client";

import * as React from "react";
import Link from "next/link";
import toast from "react-hot-toast";

interface AnalyticsData {
  users: {
    total: number;
    free: number;
    creator: number;
    pro: number;
    enterprise: number;
    paidTotal: number;
  };
  credits: {
    platformRemaining: number;
    totalConsumed: number;
  };
  generations: {
    total: number;
    totalDurationMinutes: number;
  };
  system: {
    dbStatus: string;
    dbProvider: string;
    dbLatencyMs: number;
    engine: string;
    activeVoicesCount: number;
  };
  recentGenerations: Array<{
    id: string;
    text: string;
    voiceId: string;
    status: string;
    audioUrl?: string | null;
    duration?: number | null;
    creditsUsed: number;
    createdAt: string;
    user: {
      id: string;
      email: string;
      name?: string | null;
      tier: string;
    };
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [playingAudioId, setPlayingAudioId] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const fetchAnalytics = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/analytics");
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      }
    } catch {
      toast.error("Failed to connect to Azure Database analytics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handlePlayAudio = (id: string, url?: string | null) => {
    if (!url) return;
    if (playingAudioId === id && audioRef.current) {
      audioRef.current.pause();
      setPlayingAudioId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play();
    setPlayingAudioId(id);

    audio.onended = () => setPlayingAudioId(null);
    audio.onerror = () => setPlayingAudioId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted/60 rounded-xl animate-pulse" />
          <div className="h-8 w-24 bg-muted/60 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-card/60 border border-border/60 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Platform Analytics & Control
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time telemetry and management connected to Azure PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAnalytics}
            className="px-3 py-1.5 rounded-lg border border-border/80 bg-background/80 hover:bg-muted text-xs font-semibold text-foreground transition-colors flex items-center gap-1.5"
          >
            <span>🔄 Refresh Metrics</span>
          </button>
          <Link
            href="/users"
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:bg-primary/90 transition-all"
          >
            Manage Users →
          </Link>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider">Total Users</span>
            <span className="p-1 rounded bg-primary/10 text-primary">👥</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
            {data?.users.total.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="text-emerald-400 font-semibold">{data?.users.paidTotal} Paid Members</span>
            <span>•</span>
            <span>{data?.users.free} Free</span>
          </div>
        </div>

        {/* Credits Remaining */}
        <div className="p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider">Credits Pool</span>
            <span className="p-1 rounded bg-amber-500/10 text-amber-400">⚡</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
            {data?.credits.platformRemaining.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {data?.credits.totalConsumed.toLocaleString()} credits used total
          </div>
        </div>

        {/* Voiceover Generations */}
        <div className="p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider">Voiceovers Synthesized</span>
            <span className="p-1 rounded bg-accent/10 text-accent">🎙️</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
            {data?.generations.total.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground">
            ~{data?.generations.totalDurationMinutes} mins of audio generated
          </div>
        </div>

        {/* Database Health & Latency */}
        <div className="p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider">Azure Database</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            {data?.system.dbLatencyMs}ms
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            {data?.system.activeVoicesCount} Active Voice Models
          </div>
        </div>
      </div>

      {/* Tier Breakdown & Quick Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Tier Distribution & Engine Info */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md space-y-4">
            <h3 className="font-bold text-sm text-foreground tracking-tight">
              Subscription Tier Distribution
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/60 border border-border/40">
                <span className="font-semibold text-foreground">Free Tier ($0)</span>
                <span className="font-mono font-bold text-muted-foreground">{data?.users.free} Users</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/60 border border-border/40">
                <span className="font-semibold text-foreground">Creator Plan ($19/mo)</span>
                <span className="font-mono font-bold text-primary">{data?.users.creator} Users</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/60 border border-border/40">
                <span className="font-semibold text-foreground">Pro Plan ($49/mo)</span>
                <span className="font-mono font-bold text-accent">{data?.users.pro} Users</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/60 border border-border/40">
                <span className="font-semibold text-foreground">Enterprise</span>
                <span className="font-mono font-bold text-emerald-400">{data?.users.enterprise} Users</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/40">
              <Link
                href="/users"
                className="w-full py-2 rounded-lg bg-secondary hover:bg-muted text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Override User Plans & Credits →</span>
              </Link>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md space-y-3">
            <h3 className="font-bold text-sm text-foreground tracking-tight">
              AI Engine & Model Specs
            </h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Model Engine:</span>
                <span className="font-mono text-foreground font-semibold">Fish Audio S2.1 Pro</span>
              </div>
              <div className="flex justify-between">
                <span>Languages:</span>
                <span className="font-mono text-foreground">83 Languages</span>
              </div>
              <div className="flex justify-between">
                <span>Zero-Shot Cloning:</span>
                <span className="text-emerald-400 font-semibold">Enabled</span>
              </div>
            </div>
            <Link
              href="/voices"
              className="w-full py-2 rounded-lg border border-border/60 hover:bg-muted text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Manage Platform Voices (7 Active) →</span>
            </Link>
          </div>
        </div>

        {/* Right: Live Speech Synthesis Stream */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-foreground tracking-tight">
                Live Speech Synthesis Activity Feed
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <Link href="/generations" className="text-xs text-primary hover:underline">
              View All Generations →
            </Link>
          </div>

          <div className="space-y-3">
            {data?.recentGenerations.map((gen) => (
              <div
                key={gen.id}
                className="p-4 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-foreground">
                      {gen.user.name || gen.user.email}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase font-mono">
                      {gen.user.tier}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      • {gen.creditsUsed} Credits
                    </span>
                    {gen.status === "COMPLETED" ? (
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        Ready {gen.duration ? `(${gen.duration}s)` : ""}
                      </span>
                    ) : (
                      <span className="text-[10px] text-destructive font-semibold">
                        {gen.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 italic">
                    &ldquo;{gen.text}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {gen.audioUrl && (
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(gen.id, gen.audioUrl)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        playingAudioId === gen.id
                          ? "bg-primary text-primary-foreground animate-pulse"
                          : "bg-background border border-border/80 hover:bg-muted text-foreground"
                      }`}
                    >
                      {playingAudioId === gen.id ? "⏹ Pause" : "▶ Play Audio"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
