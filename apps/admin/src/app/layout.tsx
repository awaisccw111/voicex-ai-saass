import * as React from "react";
import Link from "next/link";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata = {
  title: "VOICEX Admin Portal | Enterprise Platform Control",
  description: "Executive administrative dashboard for VOICEX AI Voice SaaS",
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col md:flex-row">
        <Toaster
          position="top-right"
          toastOptions={{
            className: "!bg-card !text-foreground !border !border-border/80 !shadow-2xl !text-xs !font-medium",
            duration: 4000,
          }}
        />

        {/* Admin Sidebar */}
        <aside className="w-64 shrink-0 border-r border-border/60 bg-card/70 backdrop-blur-xl flex flex-col justify-between p-4 sticky top-0 h-screen overflow-y-auto">
          <div className="space-y-6">
            {/* Header Brand */}
            <div className="px-2 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-black text-white text-sm shadow-glow">
                  VX
                </div>
                <div>
                  <h1 className="font-extrabold text-sm tracking-tight text-foreground">
                    VOICEX <span className="text-primary font-mono text-xs">ADMIN</span>
                  </h1>
                  <p className="text-[10px] text-muted-foreground">Azure PostgreSQL Live</p>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1 text-sm font-medium">
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Analytics & Overview</span>
              </Link>

              <Link
                href="/users"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Users & Plans</span>
              </Link>

              <Link
                href="/voices"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
                <span>Platform Voices</span>
              </Link>

              <Link
                href="/generations"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <span>Voiceover Stream</span>
              </Link>

              <Link
                href="/transactions"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Credit Ledger</span>
              </Link>
            </nav>
          </div>

          {/* Footer Info */}
          <div className="pt-4 border-t border-border/40 space-y-3">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-foreground">Live Database Sync</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Any change here updates the live SaaS platform immediately.
              </p>
            </div>

            <div className="text-[10px] text-muted-foreground px-1">
              VOICEX Admin v2.0 • Local Host
            </div>
          </div>
        </aside>

        {/* Right Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border/60 bg-card/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Management Portal
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span className="text-xs font-mono text-primary font-bold">Port 3001</span>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://voicex-ai-saass-web-two.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 bg-background/80 px-2.5 py-1.5 rounded-lg border border-border/60 hover:border-primary/40 transition-colors"
              >
                <span>Open Live Vercel App</span>
                <span>↗</span>
              </a>
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
