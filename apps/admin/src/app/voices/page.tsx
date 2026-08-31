"use client";

import * as React from "react";

interface PlatformVoice {
  id: string;
  fishAudioId: string;
  name: string;
  gender: string;
  category: string;
  language: string;
  languageName: string;
  tags: string[];
  isPremium: boolean;
  isActive: boolean;
  order: number;
  createdAt: string;
}

const BLANK_VOICE = {
  fishAudioId: "",
  name: "",
  gender: "neutral",
  category: "conversational",
  language: "en-US",
  languageName: "English (United States) 🇺🇸",
  tags: "",
  isPremium: false,
};

export default function VoicesPage() {
  const [voices, setVoices] = React.useState<PlatformVoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showAdd, setShowAdd] = React.useState(false);
  const [form, setForm] = React.useState(BLANK_VOICE);
  const [saving, setSaving] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/voices");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setVoices(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error loading voices");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const toggleActive = async (v: PlatformVoice) => {
    setPendingId(v.id);
    await fetch(`/api/voices/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !v.isActive }),
    });
    await load();
    setPendingId(null);
  };

  const deleteVoice = async (v: PlatformVoice) => {
    if (!confirm(`Delete "${v.name}"? This will remove it from the live app immediately.`)) return;
    setPendingId(v.id);
    await fetch(`/api/voices/${v.id}`, { method: "DELETE" });
    await load();
    setPendingId(null);
  };

  const addVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fishAudioId || !form.name) { alert("Fish Audio ID and Name are required."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/voices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setShowAdd(false);
      setForm(BLANK_VOICE);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to add voice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Voice Catalog Manager</h1>
          <p className="text-sm text-[#6b7494]">
            Changes here reflect immediately on the live Vercel app · {voices.length} voices
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 rounded-lg bg-[#1c2030] border border-[#1e2236] text-xs text-[#6b7494] hover:text-white transition-all">🔄</button>
          <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all">
            + Add Voice
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">⚠️ {error}</div>}

      {/* Add Voice Form */}
      {showAdd && (
        <form onSubmit={addVoice} className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-6 space-y-4">
          <h2 className="text-sm font-bold text-white">Add New Voice Actor</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {[
              { key: "fishAudioId", label: "Fish Audio Model ID *", placeholder: "e.g. b347db033a6549378b48d00acb0d06cd" },
              { key: "name", label: "Display Name *", placeholder: "e.g. Selene" },
              { key: "language", label: "Language Code", placeholder: "en-US" },
              { key: "languageName", label: "Language Label", placeholder: "English (United States) 🇺🇸" },
              { key: "tags", label: "Tags (comma-separated)", placeholder: "Calm, Meditation, Soft" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-[#6b7494] mb-1">{label}</label>
                <input
                  value={(form as any)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full h-9 px-3 rounded-lg border border-[#1e2236] bg-[#111520] text-white outline-none focus:border-indigo-500/50 text-xs"
                />
              </div>
            ))}
            <div>
              <label className="block text-[#6b7494] mb-1">Gender</label>
              <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-[#1e2236] bg-[#111520] text-white outline-none text-xs">
                <option>neutral</option><option>male</option><option>female</option>
              </select>
            </div>
            <div>
              <label className="block text-[#6b7494] mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-[#1e2236] bg-[#111520] text-white outline-none text-xs">
                <option>conversational</option><option>narrative</option><option>commercial</option>
                <option>meditation</option><option>gaming</option><option>news</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-[#6b7494] cursor-pointer">
            <input type="checkbox" checked={form.isPremium} onChange={(e) => setForm((f) => ({ ...f, isPremium: e.target.checked }))} />
            Premium voice (requires paid plan)
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50">
              {saving ? "Adding..." : "Add Voice"}
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg bg-[#1c2030] text-[#6b7494] text-xs hover:text-white">Cancel</button>
          </div>
        </form>
      )}

      {/* Voices Table */}
      <div className="rounded-xl border border-[#1e2236] bg-[#111520] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#0d1018] border-b border-[#1e2236] text-[#6b7494] uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Fish Audio ID</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Tags</th>
                <th className="px-4 py-3 text-center">Premium</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2236]">
              {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-[#6b7494] animate-pulse">Loading voices...</td></tr>}
              {!loading && voices.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-[#6b7494]">No voices in database. Add one above.</td></tr>}
              {voices.map((v) => (
                <tr key={v.id} className={`hover:bg-[#0d1018] transition-colors ${!v.isActive ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{v.name}</div>
                    <div className="text-[10px] text-[#6b7494]">{v.gender} · {v.languageName}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-indigo-400">{v.fishAudioId.slice(0, 16)}…</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-[#1c2030] text-[#6b7494] border border-[#1e2236]">{v.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {v.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 rounded bg-[#1c2030] text-[#6b7494] text-[10px]">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {v.isPremium ? <span className="text-amber-400">⭐</span> : <span className="text-[#6b7494]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-[#1c2030] text-[#6b7494]"}`}>
                      {v.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        disabled={pendingId === v.id}
                        onClick={() => toggleActive(v)}
                        className={`text-[10px] px-2 py-1 rounded border transition-all disabled:opacity-50 ${v.isActive ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10" : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"}`}
                      >
                        {v.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        disabled={pendingId === v.id}
                        onClick={() => deleteVoice(v)}
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
