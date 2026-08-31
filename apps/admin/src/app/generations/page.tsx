"use client";

import * as React from "react";

interface Generation {
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
  user: { id: string; email: string; name?: string | null; tier: string };
}

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: "bg-emerald-500/15 text-emerald-400",
  FAILED: "bg-red-500/15 text-red-400",
  PROCESSING: "bg-amber-500/15 text-amber-400",
  PENDING: "bg-[#1c2030] text-[#6b7494]",
};

export default function GenerationsPage() {
  const [data, setData] = React.useState<Generation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState("");
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await fetch(`/api/generations?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [status]);

  React.useEffect(() => { load(); }, [load]);

  const play = (g: Generation) => {
    if (!g.audioUrl) return;
    if (playingId === g.id) { audioRef.current?.pause(); setPlayingId(null); return; }
    audioRef.current?.pause();
    const a = new Audio(g.audioUrl);
    audioRef.current = a;
    a.play();
    setPlayingId(g.id);
    a.onended = () => setPlayingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Synthesis Generations Audit</h1>
          <p className="text-sm text-[#6b7494]">{data.length} records · Live from Azure PostgreSQL</p>
        </div>
        <div className="flex gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#1e2236] bg-[#111520] text-xs text-white outline-none">
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="PROCESSING">Processing</option>
            <option value="PENDING">Pending</option>
          </select>
          <button onClick={load} className="px-3 py-2 rounded-lg bg-[#1c2030] border border-[#1e2236] text-xs text-[#6b7494] hover:text-white">🔄</button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">⚠️ {error}</div>}

      <div className="rounded-xl border border-[#1e2236] bg-[#111520] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#0d1018] border-b border-[#1e2236] text-[#6b7494] uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Script</th>
                <th className="px-4 py-3 text-left">Voice ID</th>
                <th className="px-4 py-3 text-center">Credits</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2236]">
              {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-[#6b7494] animate-pulse">Loading generations...</td></tr>}
              {!loading && data.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-[#6b7494]">No generation records found.</td></tr>}
              {data.map((g) => (
                <tr key={g.id} className="hover:bg-[#0d1018] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{g.user.name ?? "User"}</div>
                    <div className="text-[10px] text-[#6b7494]">{g.user.email}</div>
                    <span className="text-[10px] text-indigo-400">{g.user.tier}</span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-white/80 italic line-clamp-2">"{g.text}"</p>
                    <span className="text-[10px] text-[#6b7494]">{g.text.length} chars · {g.format.toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-indigo-400">{g.voiceId.slice(0, 14)}…</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-white">{g.creditsUsed}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_STYLE[g.status] ?? ""}`}>{g.status}</span>
                    {g.audioUrl && (
                      <button onClick={() => play(g)} className={`ml-2 px-2 py-0.5 rounded text-[10px] border transition-all ${playingId === g.id ? "bg-indigo-600 text-white border-indigo-500" : "border-[#1e2236] text-[#6b7494] hover:text-white"}`}>
                        {playingId === g.id ? "⏹" : "▶"}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-[#6b7494]">{new Date(g.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
