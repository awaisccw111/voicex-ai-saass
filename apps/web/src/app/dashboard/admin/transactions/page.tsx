"use client";

import * as React from "react";
import toast from "react-hot-toast";

interface TransactionItem {
  id: string;
  amount: number;
  type: "PURCHASE" | "USAGE" | "BONUS" | "REFUND";
  description?: string | null;
  stripeSessionId?: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    tier: string;
    credits: number;
  };
}

export default function CreditTransactionsPage() {
  const [transactions, setTransactions] = React.useState<readonly TransactionItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [typeFilter, setTypeFilter] = React.useState("ALL");

  const fetchTransactions = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.set("type", typeFilter);

      const res = await fetch(`/api/admin/transactions?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setTransactions(json.data);
      }
    } catch {
      toast.error("Failed to load credit transactions");
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter]);

  React.useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Platform Credit Transactions & Billing Ledger
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Complete audit trail of all credit usages, bonus grants, purchases, and automatic failure refunds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground outline-none"
          >
            <option value="ALL">All Transaction Types</option>
            <option value="USAGE">Usage (Synthesis Deductions)</option>
            <option value="BONUS">Bonus (Signups & Admin Grants)</option>
            <option value="PURCHASE">Purchases (Stripe Checkout)</option>
            <option value="REFUND">Refunds (API Auto-refunds)</option>
          </select>

          <button
            type="button"
            onClick={fetchTransactions}
            className="px-3 py-1.5 rounded-lg border border-border/80 bg-background/80 hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-background/80 border-b border-border/60 text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Type</th>
                <th className="p-4">Credits Change</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground animate-pulse">
                    Loading transaction ledger from Azure PostgreSQL...
                  </td>
                </tr>
              )}

              {!isLoading && transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No transactions recorded.
                  </td>
                </tr>
              )}

              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                  {/* User */}
                  <td className="p-4 whitespace-nowrap">
                    <div className="font-bold text-foreground">{tx.user.name || "User"}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{tx.user.email}</div>
                  </td>

                  {/* Type */}
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        tx.type === "USAGE"
                          ? "bg-muted text-muted-foreground"
                          : tx.type === "BONUS"
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : tx.type === "PURCHASE"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>

                  {/* Credits */}
                  <td className="p-4">
                    <span
                      className={`font-mono font-extrabold text-sm ${
                        tx.type === "USAGE"
                          ? "text-destructive"
                          : "text-emerald-400"
                      }`}
                    >
                      {tx.type === "USAGE" ? `-${tx.amount}` : `+${tx.amount}`}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1">Credits</span>
                  </td>

                  {/* Description */}
                  <td className="p-4 max-w-sm">
                    <p className="text-foreground/90 font-medium line-clamp-1">
                      {tx.description || "Credit transaction"}
                    </p>
                    {tx.stripeSessionId && (
                      <span className="text-[10px] text-muted-foreground font-mono truncate block">
                        Stripe: {tx.stripeSessionId}
                      </span>
                    )}
                  </td>

                  {/* Timestamp */}
                  <td className="p-4 text-right whitespace-nowrap text-[11px] text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleString()}
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
