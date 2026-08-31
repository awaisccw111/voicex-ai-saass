"use client";

import * as React from "react";

interface Analytics {
  totalUsers: number;
  freeUsers: number;
  paidUsers: number;
  suspendedUsers: number;
  totalGenerations: number;
  completedGenerations: number;
  failedGenerations: number;
  successRate: number;
  totalTransactions: number;
  totalCreditsRemaining: number;
  totalCreditsConsumed: number;
  tierBreakdown: { tier: string; count: number }[];
  recentGenerations: {
    id: string;
    text: string;
    voiceId: string;
    status: string;
    creditsUsed: number;
    audioUrl?: string | null;
    createdAt: string;
    user: { email: string; name?: string | null; tier: string };
  }[];
}

export default function AdminDashboard() {
  const [data, setData] = React.useState<Analytics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/analytics");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load analytics");
      setData(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30s
  React.useEffect(() => {
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const playAudio = (gen: Analytics["recentGenerations"][0]) => {
    if (!gen.audioUrl) return;
    if (playingId === gen.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const a = new Audio(gen.audioUrl);
    audioRef.current = a;
    a.play();
    setPlayingId(gen.id);
    a.onended = () => setPlayingId(null);
  };

  const TIER_COLOR: Record<string, string> = {
    FREE: "bg-[#1c2030] text-[#6b7494]",
    CREATOR: "bg-indigo-500/15 text-indigo-400",
    PRO: "bg-purple-500/15 text-purple-400",
    ENTERPRISE: "bg-emerald-500/15 text-emerald-400",
  };

  const STATUS_COLOR: Record<string, string> = {
    COMPLETED: "text-emerald-400",
    FAILED: "text-red-400",
    PROCESSING: "text-amber-400",
    PENDING: "text-[#6b7494]",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Dashboard</h1>
          <p className="text-sm text-[#6b7494] mt-0.5">Real-time data from Azure PostgreSQL · Auto-refreshes every 30s</p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-lg bg-[#1c2030] border border-[#1e2236] text-sm text-[#6b7494] hover:text-white hover:border-indigo-500/50 transition-all"
        >
          🔄 Refresh Now
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          ⚠️ Database error: {error}
          <br />
          <span className="text-xs text-[#6b7494] mt-1 block">Make sure your .env.local has the correct DATABASE_URL and Azure PostgreSQL is running.</span>
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-[#111520] border border-[#1e2236] animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: data.totalUsers, sub: `${data.freeUsers} free · ${data.paidUsers} paid`, icon: "👥", color: "text-indigo-400" },
              { label: "Suspended", value: data.suspendedUsers, sub: "accounts flagged", icon: "🚫", color: "text-red-400" },
              { label: "Total Generations", value: data.totalGenerations, sub: `${data.successRate}% success rate`, icon: "🎙️", color: "text-purple-400" },
              { label: "Failed Jobs", value: data.failedGenerations, sub: "auto-refunded", icon: "⚠️", color: "text-amber-400" },
              { label: "Credits Remaining", value: data.totalCreditsRemaining.toLocaleString(), sub: "across all users", icon: "💳", color: "text-emerald-400" },
              { label: "Credits Consumed", value: data.totalCreditsConsumed.toLocaleString(), sub: "total platform usage", icon: "📉", color: "text-rose-400" },
              { label: "Transactions", value: data.totalTransactions, sub: "purchase + usage", icon: "📊", color: "text-cyan-400" },
              { label: "Completed Jobs", value: data.completedGenerations, sub: "ready audio files", icon: "✅", color: "text-green-400" },
            ].map((card) => (
              <div key={card.label} className="stat-card rounded-xl bg-[#111520] border border-[#1e2236] p-5">
                <div className="text-xl mb-2">{card.icon}</div>
                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                <div className="text-xs font-semibold text-white mt-1">{card.label}</div>
                <div className="text-[11px] text-[#6b7494] mt-0.5">{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Tier Breakdown */}
          <div className="rounded-xl bg-[#111520] border border-[#1e2236] p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Subscription Tier Breakdown</h2>
            <div className="flex flex-wrap gap-3">
              {data.tierBreakdown.map((t) => (
                <div key={t.tier} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${TIER_COLOR[t.tier] ?? "bg-[#1c2030] text-white"}`}>
                  <span>{t.tier}</span>
                  <span className="text-lg font-bold">{t.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Generations Live Feed */}
          <div className="rounded-xl bg-[#111520] border border-[#1e2236] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2236]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-live" />
                <h2 className="text-sm font-semibold text-white">Live Synthesis Feed</h2>
              </div>
              <span className="text-[11px] text-[#6b7494]">Last 20 generations</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#0d1018] border-b border-[#1e2236] text-[#6b7494] uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Script</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Credits</th>
                    <th className="px-4 py-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2236]">
                  {data.recentGenerations.map((g) => (
                    <tr key={g.id} className="hover:bg-[#0d1018] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{g.user.name ?? "User"}</div>
                        <div className="text-[10px] text-[#6b7494]">{g.user.email}</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="truncate text-[#e8eaf0]/80 italic">"{g.text.slice(0, 60)}{g.text.length > 60 ? "…" : ""}"</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${STATUS_COLOR[g.status] ?? "text-white"}`}>{g.status}</span>
                        {g.audioUrl && (
                          <button
                            onClick={() => playAudio(g)}
                            className={`ml-2 px-2 py-0.5 rounded text-[10px] border transition-all ${playingId === g.id ? "bg-indigo-600 text-white border-indigo-500" : "border-[#1e2236] text-[#6b7494] hover:text-white"}`}
                          >
                            {playingId === g.id ? "⏹" : "▶"}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">{g.creditsUsed}</td>
                      <td className="px-4 py-3 text-right text-[#6b7494]">
                        {new Date(g.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                  {data.recentGenerations.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-[#6b7494]">No generations yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
