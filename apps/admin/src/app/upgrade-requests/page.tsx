"use client";

import * as React from "react";

type UpgradeRequest = {
  id: string;
  planName: string;
  planPrice: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    tier: string;
    credits: number;
  };
};

export default function UpgradeRequestsPage() {
  const [requests, setRequests] = React.useState<UpgradeRequest[]>([]);
  const [filter, setFilter] = React.useState("PENDING");
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState<Record<string, string>>({});

  const fetchRequests = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/upgrade-requests?status=${filter}`);
      const data = await res.json();
      if (data.success) setRequests(data.data);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (id: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(`${id}-${status}`);
    try {
      await fetch("/api/upgrade-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, adminNotes: notes[id] ?? "" }),
      });
      await fetchRequests();
    } finally {
      setActionLoading(null);
    }
  };

  const statusColor = {
    PENDING: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    APPROVED: "text-green-400 bg-green-400/10 border-green-400/30",
    REJECTED: "text-red-400 bg-red-400/10 border-red-400/30",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upgrade Requests</h1>
        <p className="text-sm text-gray-400">Review and approve manual payment upgrade requests from users.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["PENDING", "APPROVED", "REJECTED", "ALL"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filter === s
                ? "bg-primary text-white border-primary"
                : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No {filter.toLowerCase()} requests.</div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white">{req.user.name ?? "Unknown"}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${statusColor[req.status]}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{req.user.email}</p>
                  <p className="text-xs text-gray-500">Current tier: <span className="text-primary font-semibold">{req.user.tier}</span> • Credits: {req.user.credits.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{req.planName}</p>
                  <p className="text-xs text-primary font-semibold">{req.planPrice}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {req.status === "PENDING" && (
                <div className="space-y-3 pt-3 border-t border-gray-800">
                  <input
                    type="text"
                    placeholder="Admin notes (optional)"
                    value={notes[req.id] ?? ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction(req.id, "APPROVED")}
                      disabled={!!actionLoading}
                      className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-bold transition-colors"
                    >
                      {actionLoading === `${req.id}-APPROVED` ? "Approving..." : "✅ Approve & Upgrade User"}
                    </button>
                    <button
                      onClick={() => handleAction(req.id, "REJECTED")}
                      disabled={!!actionLoading}
                      className="flex-1 py-2 rounded-lg bg-red-900/50 hover:bg-red-800 disabled:opacity-50 text-red-300 text-sm font-bold transition-colors"
                    >
                      {actionLoading === `${req.id}-REJECTED` ? "Rejecting..." : "❌ Reject"}
                    </button>
                  </div>
                </div>
              )}

              {req.adminNotes && (
                <p className="text-xs text-gray-400 pt-2 border-t border-gray-800">
                  <span className="font-semibold">Notes:</span> {req.adminNotes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
