"use client";

import * as React from "react";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description?: string | null;
  stripeSessionId?: string | null;
  createdAt: string;
  user: { id: string; email: string; name?: string | null; tier: string; credits: number };
}

const TYPE_STYLE: Record<string, string> = {
  USAGE: "bg-[#1c2030] text-[#6b7494] border-[#1e2236]",
  BONUS: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  PURCHASE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  REFUND: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

export default function TransactionsPage() {
  const [data, setData] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [type, setType] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      const res = await fetch(`/api/transactions?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [type]);

  React.useEffect(() => { load(); }, [load]);

  const totalAmount = data.reduce((sum, t) => sum + (t.type === "USAGE" ? -t.amount : t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Credit Transactions Ledger</h1>
          <p className="text-sm text-[#6b7494]">{data.length} records · Net balance: <span className={totalAmount >= 0 ? "text-emerald-400" : "text-red-400"}>{totalAmount >= 0 ? "+" : ""}{totalAmount.toLocaleString()}</span></p>
        </div>
        <div className="flex gap-2">
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#1e2236] bg-[#111520] text-xs text-white outline-none">
            <option value="">All Types</option>
            <option value="USAGE">Usage</option>
            <option value="BONUS">Bonus</option>
            <option value="PURCHASE">Purchase</option>
            <option value="REFUND">Refund</option>
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
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2236]">
              {loading && <tr><td colSpan={5} className="px-4 py-8 text-center text-[#6b7494] animate-pulse">Loading transactions...</td></tr>}
              {!loading && data.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-[#6b7494]">No transactions found.</td></tr>}
              {data.map((t) => (
                <tr key={t.id} className="hover:bg-[#0d1018] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{t.user.name ?? "User"}</div>
                    <div className="text-[10px] text-[#6b7494]">{t.user.email}</div>
                    <div className="text-[10px] text-[#6b7494]">Balance: {t.user.credits.toLocaleString()}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${TYPE_STYLE[t.type] ?? ""}`}>{t.type}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-mono font-bold text-sm ${t.type === "USAGE" ? "text-red-400" : "text-emerald-400"}`}>
                      {t.type === "USAGE" ? `-${t.amount}` : `+${t.amount}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-white/80 line-clamp-1">{t.description ?? "—"}</p>
                    {t.stripeSessionId && <span className="text-[10px] text-[#6b7494] font-mono">Stripe: {t.stripeSessionId.slice(0, 20)}…</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-[#6b7494]">{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
