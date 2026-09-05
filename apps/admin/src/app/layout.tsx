import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "VOICEX Admin Portal",
  description: "Enterprise Admin Control Panel for VOICEX AI Platform",
};

const NAV = [
  { href: "/", label: "📊 Dashboard" },
  { href: "/users", label: "👥 Users" },
  { href: "/voices", label: "🎙️ Voices" },
  { href: "/generations", label: "📜 Generations" },
  { href: "/transactions", label: "💳 Transactions" },
  { href: "/collaborators", label: "🤝 Collaborators" },
  { href: "/upgrade-requests", label: "⬆️ Upgrade Requests" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0d14] text-[#e8eaf0] font-sans flex">
        {/* Sidebar */}
        <aside className="w-60 shrink-0 bg-[#0d1018] border-r border-[#1e2236] flex flex-col h-screen sticky top-0 overflow-y-auto">
          {/* Logo */}
          <div className="px-5 py-5 border-b border-[#1e2236]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                V
              </div>
              <div>
                <div className="font-bold text-sm text-white tracking-tight">VOICEX</div>
                <div className="text-[10px] text-[#6b7494] uppercase tracking-widest">Admin Portal</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#6b7494] hover:text-white hover:bg-[#1c2030] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-[#1e2236]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-live shrink-0" />
              <span className="text-[11px] text-[#6b7494]">Azure PostgreSQL Live</span>
            </div>
            <p className="text-[10px] text-[#3d4460] mt-1">voicex-db.postgres.database.azure.com</p>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-h-screen overflow-y-auto">
          <div className="p-6 max-w-screen-xl">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
