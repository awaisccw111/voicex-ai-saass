"use client";

import { useState } from "react";

export function RedeemClient({ alreadyRedeemed }: { alreadyRedeemed: boolean }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  
  if (alreadyRedeemed && !isSuccess) {
    return (
      <div className="bg-[#0d1018] p-6 rounded-xl border border-gray-800">
        <h2 className="text-xl font-bold mb-2">Invite Code</h2>
        <p className="text-green-500 font-medium">You have already redeemed an invite code! 🎉</p>
      </div>
    );
  }

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/collaboration/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIsSuccess(true);
      setMsg("Success! You've received 500 free credits.");
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0d1018] p-6 rounded-xl border border-gray-800">
      <h2 className="text-xl font-bold mb-2">Redeem Invite Code</h2>
      <p className="text-sm text-gray-400 mb-4">Have a partner invite code? Enter it here to get 500 free credits!</p>
      
      {isSuccess ? (
        <p className="text-green-500 font-medium">{msg}</p>
      ) : (
        <form onSubmit={handleRedeem} className="flex gap-2 max-w-sm">
          <input 
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="VX-XXXXX"
            className="flex-1 bg-[#1c2030] border border-gray-700 rounded-lg px-4 uppercase focus:outline-none focus:border-primary"
            required
          />
          <button 
            type="submit" 
            disabled={loading || !code}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? "..." : "Redeem"}
          </button>
        </form>
      )}
      {!isSuccess && msg && <p className="text-red-400 text-sm mt-2">{msg}</p>}
    </div>
  );
}
