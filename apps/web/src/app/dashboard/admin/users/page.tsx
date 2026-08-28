"use client";

import * as React from "react";
import toast from "react-hot-toast";

interface UserItem {
  id: string;
  email: string;
  name?: string | null;
  credits: number;
  tier: "FREE" | "CREATOR" | "PRO" | "ENTERPRISE";
  role: string;
  isSuspended: boolean;
  createdAt: string;
  _count: {
    voiceGenerations: number;
    clonedVoices: number;
    creditTransactions: number;
  };
}

export default function UsersManagementPage() {
  const [users, setUsers] = React.useState<readonly UserItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [tierFilter, setTierFilter] = React.useState("ALL");

  // Selected user for modal action
  const [selectedUser, setSelectedUser] = React.useState<UserItem | null>(null);
  const [creditAdjustment, setCreditAdjustment] = React.useState<number>(500);
  const [newTier, setNewTier] = React.useState<string>("PRO");
  const [isActionLoading, setIsActionLoading] = React.useState(false);
  const [modalType, setModalType] = React.useState<"tier" | "credits" | "delete" | null>(null);

  const fetchUsers = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (tierFilter !== "ALL") params.set("tier", tierFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setUsers(json.data);
      }
    } catch {
      toast.error("Failed to load users from database");
    } finally {
      setIsLoading(false);
    }
  }, [search, tierFilter]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Tier Override
  const handleUpdateTier = async () => {
    if (!selectedUser) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: newTier }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`User plan updated to ${newTier}! Pro features unlocked immediately.`);
        setModalType(null);
        fetchUsers();
      } else {
        toast.error(json.error?.message || "Failed to update plan");
      }
    } catch {
      toast.error("Network error updating plan");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Credit Adjustment
  const handleAdjustCredits = async () => {
    if (!selectedUser) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditDelta: creditAdjustment }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Adjusted credits by ${creditAdjustment > 0 ? "+" : ""}${creditAdjustment}! New balance: ${json.data.credits}`);
        setModalType(null);
        fetchUsers();
      } else {
        toast.error(json.error?.message || "Failed to adjust credits");
      }
    } catch {
      toast.error("Network error adjusting credits");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Toggle Account Suspension
  const handleToggleSuspend = async (user: UserItem) => {
    const willSuspend = !user.isSuspended;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuspended: willSuspend }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(willSuspend ? `Account for ${user.email} suspended.` : `Account unsuspended.`);
        fetchUsers();
      }
    } catch {
      toast.error("Error toggling account suspension");
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("User and all associated audio records deleted.");
        setModalType(null);
        fetchUsers();
      } else {
        toast.error(json.error?.message || "Failed to delete user");
      }
    } catch {
      toast.error("Error deleting user");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            User Accounts & Plan Overrides
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            View user details, manually grant Pro/Enterprise tiers without Stripe, adjust credits, and manage access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchUsers}
            className="px-3 py-1.5 rounded-lg border border-border/80 bg-background/80 hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            🔄 Refresh List
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search users by email, name, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:border-primary outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:border-primary outline-none"
          >
            <option value="ALL">All Plans</option>
            <option value="FREE">Free Tier</option>
            <option value="CREATOR">Creator Plan ($19)</option>
            <option value="PRO">Pro Plan ($49)</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-background/80 border-b border-border/60 text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="p-4">User / Email</th>
                <th className="p-4">Current Plan</th>
                <th className="p-4">Credit Balance</th>
                <th className="p-4">Activity Stats</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground animate-pulse">
                    Loading users from Azure PostgreSQL...
                  </td>
                </tr>
              )}

              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No users found matching your search.
                  </td>
                </tr>
              )}

              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  {/* User info */}
                  <td className="p-4">
                    <div className="font-bold text-sm text-foreground">{u.name || "No Name"}</div>
                    <div className="text-muted-foreground text-[11px] font-mono">{u.email}</div>
                    <div className="text-[10px] text-muted-foreground/60">Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                  </td>

                  {/* Plan Tier Badge */}
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                        u.tier === "ENTERPRISE"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : u.tier === "PRO"
                          ? "bg-accent/15 text-accent border border-accent/30"
                          : u.tier === "CREATOR"
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {u.tier}
                    </span>
                  </td>

                  {/* Credits */}
                  <td className="p-4">
                    <div className="font-extrabold text-sm font-mono text-foreground">
                      {u.credits.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Credits</div>
                  </td>

                  {/* Activity Stats */}
                  <td className="p-4 space-y-0.5 text-[11px] text-muted-foreground">
                    <div>🎙️ {u._count.voiceGenerations} Voiceovers</div>
                    <div>🧬 {u._count.clonedVoices} Cloned Voices</div>
                  </td>

                  {/* Account Status */}
                  <td className="p-4">
                    {u.isSuspended ? (
                      <span className="px-2 py-0.5 rounded bg-destructive/15 text-destructive font-semibold text-[10px]">
                        Suspended
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold text-[10px]">
                        Active
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(u);
                        setNewTier(u.tier);
                        setModalType("tier");
                      }}
                      className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold text-[11px] transition-all"
                    >
                      ⭐ Change Tier
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(u);
                        setCreditAdjustment(500);
                        setModalType("credits");
                      }}
                      className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-muted text-foreground font-semibold text-[11px] transition-all"
                    >
                      ⚡ +/- Credits
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleSuspend(u)}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                        u.isSuspended
                          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                          : "bg-destructive/10 text-destructive hover:bg-destructive hover:text-white"
                      }`}
                    >
                      {u.isSuspended ? "Unsuspend" : "Suspend"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(u);
                        setModalType("delete");
                      }}
                      className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete User"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Change Plan Tier */}
      {modalType === "tier" && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-foreground">
              Override Subscription Plan Tier
            </h3>
            <p className="text-xs text-muted-foreground">
              Directly grant plan features to <span className="text-foreground font-bold">{selectedUser.email}</span> without Stripe billing.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground block">
                Select New Plan Tier
              </label>
              <select
                value={newTier}
                onChange={(e) => setNewTier(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:border-primary outline-none"
              >
                <option value="FREE">Free Tier ($0)</option>
                <option value="CREATOR">Creator Plan ($19/mo)</option>
                <option value="PRO">Pro Plan ($49/mo - Voice Cloning Unlocked)</option>
                <option value="ENTERPRISE">Enterprise Plan (Unlimited)</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-border/40">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateTier}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-md"
              >
                {isActionLoading ? "Updating..." : "Save Plan Override"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adjust Credits */}
      {modalType === "credits" && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-foreground">
              Adjust User Credits Balance
            </h3>
            <p className="text-xs text-muted-foreground">
              Current balance for <span className="text-foreground font-bold">{selectedUser.email}</span> is{" "}
              <span className="font-bold text-primary font-mono">{selectedUser.credits} credits</span>.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground block">
                Credit Adjustment (+ to add, - to deduct)
              </label>
              <input
                type="number"
                value={creditAdjustment}
                onChange={(e) => setCreditAdjustment(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:border-primary outline-none font-mono"
              />
              <div className="flex gap-2 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => setCreditAdjustment(500)}
                  className="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground"
                >
                  +500
                </button>
                <button
                  type="button"
                  onClick={() => setCreditAdjustment(1000)}
                  className="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground"
                >
                  +1,000
                </button>
                <button
                  type="button"
                  onClick={() => setCreditAdjustment(5000)}
                  className="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground"
                >
                  +5,000
                </button>
                <button
                  type="button"
                  onClick={() => setCreditAdjustment(-500)}
                  className="px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20"
                >
                  -500
                </button>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-border/40">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdjustCredits}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-md"
              >
                {isActionLoading ? "Saving..." : "Apply Balance Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete User */}
      {modalType === "delete" && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-destructive/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-destructive">
              Delete User Account
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete <span className="text-foreground font-bold">{selectedUser.email}</span>? This will permanently delete their account, voice generation history, and credit transactions.
            </p>

            <div className="flex gap-2 justify-end pt-3 border-t border-border/40">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-lg bg-destructive text-white font-semibold text-xs shadow-md"
              >
                {isActionLoading ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
