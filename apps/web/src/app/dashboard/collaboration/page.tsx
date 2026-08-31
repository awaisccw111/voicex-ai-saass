"use client";

import { useEffect, useState } from "react";
import { CollaborationStatus, PayoutStatus } from "@saas/db";

type CollabEarning = {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
};

type PayoutReq = {
  id: string;
  amount: number;
  status: PayoutStatus;
  createdAt: string;
};

type Collaborator = {
  id: string;
  inviteCode: string;
  bankDetails: string;
  status: CollaborationStatus;
  totalInvites: number;
  totalEarnings: number;
  availableBalance: number;
  earnings: CollabEarning[];
  payoutRequests: PayoutReq[];
};

export default function CollaborationPage() {
  const [collab, setCollab] = useState<Collaborator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [socialLinks, setSocialLinks] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCollab();
  }, []);

  const fetchCollab = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/collaboration/me");
      const data = await res.json();
      if (data.collaborator) {
        setCollab(data.collaborator);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/collaboration/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialLinks, bankDetails }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchCollab();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const amount = parseFloat(withdrawAmount);
      const res = await fetch("/api/collaboration/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, bankDetails: collab?.bankDetails || "" }), // Re-use saved bank details
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("Withdrawal request submitted successfully!");
      setWithdrawAmount("");
      fetchCollab();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (isLoading) {
    return <div className="p-8 animate-pulse text-gray-400">Loading...</div>;
  }

  if (!collab) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-[#0d1018] rounded-xl border border-gray-800 mt-10">
        <h1 className="text-2xl font-bold mb-2">Join the VOICEX Partner Program</h1>
        <p className="text-gray-400 mb-6">Earn 1,000 credits plus 5% of all payments for every user you refer.</p>
        
        {error && <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded mb-4">{error}</div>}
        
        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Social Media Links / Website</label>
            <textarea 
              value={socialLinks} 
              onChange={e => setSocialLinks(e.target.value)}
              className="w-full bg-[#1c2030] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary"
              placeholder="https://youtube.com/..."
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bank Details (For Payouts)</label>
            <textarea 
              value={bankDetails} 
              onChange={e => setBankDetails(e.target.value)}
              className="w-full bg-[#1c2030] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary"
              placeholder="Bank Name, IBAN, SWIFT, Account Holder Name"
              rows={3}
              required
            />
          </div>
          <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-colors">
            Apply Now
          </button>
        </form>
      </div>
    );
  }

  if (collab.status === "PENDING") {
    return (
      <div className="max-w-xl mx-auto p-8 text-center bg-[#0d1018] rounded-xl border border-gray-800 mt-10">
        <div className="text-4xl mb-4">⏳</div>
        <h2 className="text-xl font-bold mb-2">Application Pending</h2>
        <p className="text-gray-400">Your application to the partner program is currently under review by our team. We'll get back to you shortly!</p>
      </div>
    );
  }

  if (collab.status === "REJECTED") {
    return (
      <div className="max-w-xl mx-auto p-8 text-center bg-red-900/20 rounded-xl border border-red-900/50 mt-10">
        <div className="text-4xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-red-400 mb-2">Application Declined</h2>
        <p className="text-red-300/80">Unfortunately, your application was not approved at this time.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 mt-6">
      <h1 className="text-3xl font-bold">Partner Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0d1018] p-6 rounded-xl border border-gray-800">
          <div className="text-sm text-gray-400 mb-1">Your Invite Code</div>
          <div className="text-2xl font-bold text-primary font-mono">{collab.inviteCode}</div>
          <p className="text-xs text-gray-500 mt-2">Users get 500 free credits when they use this code.</p>
        </div>
        <div className="bg-[#0d1018] p-6 rounded-xl border border-gray-800">
          <div className="text-sm text-gray-400 mb-1">Total Invites</div>
          <div className="text-3xl font-bold">{collab.totalInvites}</div>
        </div>
        <div className="bg-[#0d1018] p-6 rounded-xl border border-gray-800">
          <div className="text-sm text-gray-400 mb-1">Total Earned</div>
          <div className="text-3xl font-bold text-green-500">${collab.totalEarnings.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0d1018] p-6 rounded-xl border border-gray-800">
          <h2 className="text-xl font-bold mb-4">Available Balance</h2>
          <div className="text-4xl font-bold text-white mb-6">${collab.availableBalance.toFixed(2)}</div>
          
          {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
          {success && <div className="text-green-400 text-sm mb-3">{success}</div>}
          
          <form onSubmit={handleWithdraw} className="flex gap-2">
            <input 
              type="number" 
              step="0.01" 
              min="10"
              max={collab.availableBalance}
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              placeholder="Amount to withdraw"
              className="flex-1 bg-[#1c2030] border border-gray-700 rounded-lg px-4 focus:outline-none focus:border-primary"
              required
            />
            <button 
              type="submit" 
              disabled={collab.availableBalance < 10}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-lg transition-colors"
            >
              Withdraw
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">Minimum withdrawal: $10.00. Funds will be sent to the bank details on file.</p>
        </div>

        <div className="bg-[#0d1018] p-6 rounded-xl border border-gray-800 h-80 overflow-y-auto">
          <h2 className="text-lg font-bold mb-4">Payout History</h2>
          <div className="space-y-3">
            {collab.payoutRequests.length === 0 ? (
              <div className="text-gray-500 text-sm">No payout requests yet.</div>
            ) : (
              collab.payoutRequests.map(p => (
                <div key={p.id} className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <div>
                    <div className="font-bold">${p.amount.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    p.status === "COMPLETED" ? "bg-green-900 text-green-300" :
                    p.status === "REJECTED" ? "bg-red-900 text-red-300" :
                    "bg-yellow-900 text-yellow-300"
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
