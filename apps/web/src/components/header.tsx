"use client";

import * as React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button, Logo, Badge, Container } from "@saas/ui";
import { APP_ROUTES } from "@saas/core";

export const Header: React.FC = () => {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isAuthenticated = status === "authenticated" && Boolean(session?.user);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-all">
      <Container size="xl">
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo */}
          <Link href={APP_ROUTES.HOME} className="flex items-center gap-2 group">
            <Logo size="md" variant="full" animated />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            <Link
              href={isAuthenticated ? "/dashboard/studio" : "#demo"}
              className="hover:text-foreground transition-colors duration-150 flex items-center gap-1.5"
            >
              <span>AI Studio</span>
              <Badge variant="glow" size="sm">
                S2.1 Pro
              </Badge>
            </Link>
            <Link
              href="/#voices"
              className="hover:text-foreground transition-colors duration-150"
            >
              Voices Library
            </Link>
            <Link
              href="/#features"
              className="hover:text-foreground transition-colors duration-150"
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              className="hover:text-foreground transition-colors duration-150"
            >
              Pricing
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/dashboard/studio">
                  <Button variant="primary" size="sm">
                    Open Studio
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href={APP_ROUTES.LOGIN}>
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href={APP_ROUTES.SIGNUP}>
                  <Button
                    variant="primary"
                    size="sm"
                    rightIcon={
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    }
                  >
                    Get 1,000 Free Credits
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 flex flex-col gap-3">
            <Link
              href={isAuthenticated ? "/dashboard/studio" : "#demo"}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium py-1.5 text-muted-foreground hover:text-foreground"
            >
              AI Studio
            </Link>
            <Link
              href="/#voices"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium py-1.5 text-muted-foreground hover:text-foreground"
            >
              Voices Library
            </Link>
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium py-1.5 text-muted-foreground hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium py-1.5 text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Link>
            <div className="pt-3 border-t border-border/50 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" fullWidth>
                      Go to Dashboard
                    </Button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive py-1.5 text-center"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href={APP_ROUTES.LOGIN} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" fullWidth>
                      Sign In
                    </Button>
                  </Link>
                  <Link href={APP_ROUTES.SIGNUP} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" fullWidth>
                      Get Started Free
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </Container>
    </header>
  );
};
