"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Logo, Badge } from "@saas/ui";

export interface HeaderProps {
  readonly initialCredits: number;
  readonly tier: string;
  readonly userName?: string | null | undefined;
}

export const DashboardHeader: React.FC<HeaderProps> = ({
  initialCredits,
  tier,
  userName = "Creator",
}) => {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Section: Breadcrumb & Title */}
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <Link href="/dashboard">
              <Logo size="sm" variant="icon" />
            </Link>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <span>/</span>
            <span className="font-semibold text-foreground capitalize">
              {pathname.split("/").pop() ?? "Overview"}
            </span>
          </div>
        </div>

        {/* Right Section: Live Credits Balance & Top-Up Action */}
        <div className="flex items-center gap-3">
          {/* Credit Balance Indicator */}
          <Link href="/dashboard/settings">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/15 transition-all shadow-subtle cursor-pointer group">
              <svg
                className="w-4 h-4 text-primary group-hover:scale-110 transition-transform"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <div className="flex items-baseline gap-1 text-xs">
                <span className="font-bold text-primary text-sm font-mono">
                  {initialCredits.toLocaleString()}
                </span>
                <span className="text-muted-foreground text-[11px]">Credits</span>
              </div>
            </div>
          </Link>

          <Badge variant={tier === "FREE" ? "secondary" : "glow"} size="sm">
            {tier}
          </Badge>

          <Link href="/dashboard/settings" className="hidden sm:inline-flex">
            <Button variant="secondary" size="sm">
              Top-Up +
            </Button>
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
            aria-label="Toggle Navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileNavOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileNavOpen && (
        <div className="md:hidden border-t border-border/50 bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground mb-3 px-3">Signed in as {userName}</p>
          <Link
            href="/dashboard"
            onClick={() => setMobileNavOpen(false)}
            className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/dashboard" ? "bg-primary text-white" : "hover:bg-muted"
            }`}
          >
            🔲 Dashboard Overview
          </Link>
          <Link
            href="/dashboard/studio"
            onClick={() => setMobileNavOpen(false)}
            className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/dashboard/studio" ? "bg-primary text-white" : "hover:bg-muted"
            }`}
          >
            🎙️ AI Studio
          </Link>
          <Link
            href="/dashboard/voices"
            onClick={() => setMobileNavOpen(false)}
            className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/dashboard/voices" ? "bg-primary text-white" : "hover:bg-muted"
            }`}
          >
            👥 Voice Library
          </Link>
          <Link
            href="/dashboard/clone"
            onClick={() => setMobileNavOpen(false)}
            className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/dashboard/clone" ? "bg-primary text-white" : "hover:bg-muted"
            }`}
          >
            🔳 Voice Cloning
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={() => setMobileNavOpen(false)}
            className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/dashboard/settings" ? "bg-primary text-white" : "hover:bg-muted"
            }`}
          >
            💳 Billing &amp; Plans
          </Link>
          <Link
            href="/dashboard/collaboration"
            onClick={() => setMobileNavOpen(false)}
            className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/dashboard/collaboration" ? "bg-primary text-white" : "hover:bg-muted"
            }`}
          >
            🤝 Partner Program <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">EARN $$</span>
          </Link>
        </div>
      )}
    </header>
  );
};
