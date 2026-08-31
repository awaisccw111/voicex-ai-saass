"use client";

import * as React from "react";

interface User {
  id: string;
  email: string;
  name?: string | null;
  tier: string;
  role: string;
  credits: number;
  isSuspended: boolean;
  createdAt: string;
  _count: { voiceGenerations: number; clonedVoices: number };
}

const TIERS = ["FREE", "CREATOR", "PRO", "ENTERPRISE"];
const CREDIT_AMOUNTS = [100, 500, 1000, 5000];

const TIER_STYLE: Record<string, string> = {
  FREE: "bg-[#1c2030] text-[#6b7494] border-[#1e2236]",
  CREATOR: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  PRO: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  ENTERPRISE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export default function UsersPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [tierFilter, setTierFilter] = React.useState("");
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (tierFilter) params.set("tier", tierFilter);
      const res = await fetch(`/api/users?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setUsers(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [search, tierFilter]);

  React.useEffect(() => { load(); }, [load]);

  const action = async (userId: string, act: string, value?: string) => {
    setPendingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: act, value }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setPendingId(null);
    }
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`Permanently delete ${email}? This cannot be undone.`)) return;
    setPendingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-sm text-[#6b7494]">{users.length} users · Live from Azure PostgreSQL</p>
        </div>
        <button onClick={load} className="px-3 py-2 rounded-lg bg-[#1c2030] border border-[#1e2236] text-xs text-[#6b7494] hover:text-white transition-all">
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email or name..."
          className="h-9 px-3 rounded-lg border border-[#1e2236] bg-[#111520] text-sm text-white placeholder:text-[#6b7494] outline-none focus:border-indigo-500/50 transition-colors w-60"
        />
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-[#1e2236] bg-[#111520] text-xs text-white outline-none"
        >
          <option value="">All Tiers</option>
          {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">⚠️ {error}</div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[#1e2236] bg-[#111520] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#0d1018] border-b border-[#1e2236] text-[#6b7494] uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Tier</th>
                <th className="px-4 py-3 text-center">Credits</th>
                <th className="px-4 py-3 text-center">Jobs</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2236]">
              {loading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[#6b7494] animate-pulse">Loading users from Azure...</td></tr>
              )}
              {!loading && users.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[#6b7494]">No users found.</td></tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className={`hover:bg-[#0d1018] transition-colors ${u.isSuspended ? "opacity-50" : ""}`}>
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400">
                        {(u.name ?? u.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{u.name ?? "—"}</div>
                        <div className="text-[10px] text-[#6b7494]">{u.email}</div>
                        {u.isSuspended && <span className="text-[10px] text-red-400 font-semibold">SUSPENDED</span>}
                      </div>
                    </div>
                  </td>

                  {/* Tier */}
                  <td className="px-4 py-3">
                    <select
                      value={u.tier}
                      disabled={pendingId === u.id}
                      onChange={(e) => action(u.id, "SET_TIER", e.target.value)}
                      className={`text-[11px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${TIER_STYLE[u.tier] ?? ""} bg-transparent`}
                    >
                      {TIERS.map((t) => <option key={t} value={t} className="bg-[#111520] text-white">{t}</option>)}
                    </select>
                  </td>

                  {/* Credits */}
                  <td className="px-4 py-3 text-center">
                    <div className="font-mono font-bold text-white text-sm">{u.credits.toLocaleString()}</div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {CREDIT_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          disabled={pendingId === u.id}
                          onClick={() => action(u.id, "ADD_CREDITS", String(amt))}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all disabled:opacity-50"
                        >
                          +{amt >= 1000 ? `${amt/1000}k` : amt}
                        </button>
                      ))}
                    </div>
                  </td>

                  {/* Stats */}
                  <td className="px-4 py-3 text-center">
                    <div className="text-white font-semibold">{u._count.voiceGenerations}</div>
                    <div className="text-[10px] text-[#6b7494]">{u._count.clonedVoices} cloned</div>
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3 text-[#6b7494]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={pendingId === u.id}
                        onClick={() => action(u.id, "TOGGLE_SUSPEND")}
                        className={`text-[10px] px-2 py-1 rounded border transition-all disabled:opacity-50 ${u.isSuspended ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"}`}
                      >
                        {u.isSuspended ? "Unsuspend" : "Suspend"}
                      </button>
                      <button
                        disabled={pendingId === u.id}
                        onClick={() => deleteUser(u.id, u.email)}
                        className="text-[10px] px-2 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
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
