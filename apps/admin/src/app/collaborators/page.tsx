"use client";

import { useEffect, useState } from "react";
import { CollaborationStatus, PayoutStatus } from "@saas/db";

type Collaborator = {
  id: string;
  userId: string;
  inviteCode: string;
  socialLinks: string;
  bankDetails: string;
  status: CollaborationStatus;
  totalInvites: number;
  totalEarnings: number;
  availableBalance: number;
  createdAt: string;
  user: { name: string | null; email: string };
};

type PayoutRequest = {
  id: string;
  collaboratorId: string;
  amount: number;
  status: PayoutStatus;
  bankDetails: string;
  adminNotes: string | null;
  createdAt: string;
  collaborator: {
    user: { name: string | null; email: string };
    inviteCode: string;
  };
};

export default function CollaboratorsPage() {
  const [activeTab, setActiveTab] = useState<"requests" | "payouts">("requests");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "requests") {
        const res = await fetch("/api/collaborators");
        const data = await res.json();
        if (data.collaborators) setCollaborators(data.collaborators);
      } else {
        const res = await fetch("/api/payouts");
        const data = await res.json();
        if (data.payouts) setPayouts(data.payouts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCollabStatus = async (id: string, status: CollaborationStatus) => {
    try {
      await fetch("/api/collaborators", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const updatePayoutStatus = async (id: string, status: PayoutStatus) => {
    try {
      await fetch("/api/payouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Collaborators & Affiliates</h1>
      </div>

      <div className="flex space-x-4 border-b border-gray-800">
        <button
          onClick={() => setActiveTab("requests")}
          className={`pb-2 text-sm font-medium ${
            activeTab === "requests" ? "border-b-2 border-primary text-primary" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Collaboration Requests
        </button>
        <button
          onClick={() => setActiveTab("payouts")}
          className={`pb-2 text-sm font-medium ${
            activeTab === "payouts" ? "border-b-2 border-primary text-primary" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Payout Requests
        </button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-800 rounded-md"></div>
          <div className="h-12 bg-gray-800 rounded-md"></div>
          <div className="h-12 bg-gray-800 rounded-md"></div>
        </div>
      ) : activeTab === "requests" ? (
        <div className="rounded-md border border-gray-800">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-900 text-gray-400">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Social Links</th>
                <th className="px-6 py-3">Stats</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {collaborators.map((c) => (
                <tr key={c.id} className="border-b border-gray-800 bg-black">
                  <td className="px-6 py-4 font-medium">
                    {c.user.name || "Unknown"}
                    <div className="text-xs text-gray-500">{c.user.email}</div>
                    <div className="text-xs text-primary mt-1">Code: {c.inviteCode}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 whitespace-pre-wrap max-w-xs">{c.socialLinks}</td>
                  <td className="px-6 py-4">
                    <div>Invites: {c.totalInvites}</div>
                    <div className="text-green-500">Earned: ${c.totalEarnings.toFixed(2)}</div>
                    <div>Bal: ${c.availableBalance.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      c.status === "APPROVED" ? "bg-green-900 text-green-300" :
                      c.status === "REJECTED" ? "bg-red-900 text-red-300" :
                      "bg-yellow-900 text-yellow-300"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {c.status === "PENDING" && (
                      <>
                        <button onClick={() => updateCollabStatus(c.id, "APPROVED")} className="text-green-500 hover:underline">Approve</button>
                        <button onClick={() => updateCollabStatus(c.id, "REJECTED")} className="text-red-500 hover:underline">Reject</button>
                      </>
                    )}
                    {c.status === "APPROVED" && (
                      <button onClick={() => updateCollabStatus(c.id, "REJECTED")} className="text-red-500 hover:underline">Revoke</button>
                    )}
                    {c.status === "REJECTED" && (
                      <button onClick={() => updateCollabStatus(c.id, "APPROVED")} className="text-green-500 hover:underline">Approve</button>
                    )}
                  </td>
                </tr>
              ))}
              {collaborators.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No collaboration requests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-md border border-gray-800">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-900 text-gray-400">
              <tr>
                <th className="px-6 py-3">Collaborator</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Bank Details</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-b border-gray-800 bg-black">
                  <td className="px-6 py-4 font-medium">
                    {p.collaborator.user.name || "Unknown"}
                    <div className="text-xs text-gray-500">{p.collaborator.user.email}</div>
                  </td>
                  <td className="px-6 py-4 text-lg font-bold text-green-500">${p.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-400 whitespace-pre-wrap max-w-xs">{p.bankDetails}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      p.status === "COMPLETED" ? "bg-green-900 text-green-300" :
                      p.status === "REJECTED" ? "bg-red-900 text-red-300" :
                      "bg-yellow-900 text-yellow-300"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {p.status === "PENDING" && (
                      <>
                        <button onClick={() => updatePayoutStatus(p.id, "COMPLETED")} className="text-green-500 hover:underline">Mark Paid</button>
                        <button onClick={() => updatePayoutStatus(p.id, "REJECTED")} className="text-red-500 hover:underline">Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {payouts.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No payout requests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
