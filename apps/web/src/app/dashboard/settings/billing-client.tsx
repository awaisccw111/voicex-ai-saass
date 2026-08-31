"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
} from "@saas/ui";
import { CREDIT_PACKS, SUBSCRIPTION_PLANS } from "@/lib/lemonsqueezy";

export interface BillingClientProps {
  readonly currentTier: "FREE" | "CREATOR" | "PRO" | "ENTERPRISE";
  readonly credits: number;
  readonly hasStripeCustomer: boolean;
  readonly periodEnd?: string | undefined;
}

export const BillingClient: React.FC<BillingClientProps> = ({
  currentTier,
  credits,
  hasStripeCustomer,
  periodEnd,
}) => {
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get("checkout");
  const checkoutType = searchParams.get("type");
  const creditAmount = searchParams.get("amount");

  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleCheckoutSubscription = async (planId: "CREATOR" | "PRO") => {
    setLoadingAction(`sub-${planId}`);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/lemon/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subscription", planId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.error?.message ?? "Failed to initialize subscription checkout.");
        setLoadingAction(null);
        return;
      }

      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch {
      setErrorMessage("Network error initializing checkout. Please try again.");
      setLoadingAction(null);
    }
  };

  const handleBuyCreditPack = async (packId: "credits_1k" | "credits_5k" | "credits_20k") => {
    setLoadingAction(`pack-${packId}`);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/lemon/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "credit_pack", packId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.error?.message ?? "Failed to initialize credit purchase checkout.");
        setLoadingAction(null);
        return;
      }

      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch {
      setErrorMessage("Network error initializing checkout. Please try again.");
      setLoadingAction(null);
    }
  };

  const handleOpenCustomerPortal = async () => {
    setLoadingAction("portal");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/lemon/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.error?.message ?? "Failed to open billing portal.");
        setLoadingAction(null);
        return;
      }

      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch {
      setErrorMessage("Network error connecting to billing portal.");
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Checkout Success Banner */}
      {checkoutStatus === "success" && (
        <div className="p-4 rounded-xl bg-success/15 border border-success/30 text-success text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              <strong>Payment Successful!</strong>{" "}
              {checkoutType === "credits"
                ? `Your ${Number(creditAmount ?? 0).toLocaleString()} credits have been added to your balance.`
                : "Your subscription plan is now active."}
            </span>
          </div>
          <Badge variant="success" size="sm">
            Confirmed
          </Badge>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Current Subscription & Customer Portal Card */}
      <Card className="border-border/60 bg-card/80 backdrop-blur-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-xl">Current Membership Plan</CardTitle>
                <Badge variant={currentTier === "FREE" ? "secondary" : "glow"} size="sm">
                  {currentTier}
                </Badge>
              </div>
              <CardDescription>
                {currentTier === "FREE"
                  ? "You are currently on the Free tier (1,000 complimentary starter credits)."
                  : `Active ${currentTier} subscription${periodEnd ? ` • Renews ${periodEnd}` : ""}`}
              </CardDescription>
            </div>

            {hasStripeCustomer && (
              <Button
                variant="secondary"
                size="md"
                onClick={handleOpenCustomerPortal}
                isLoading={loadingAction === "portal"}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                }
              >
                Manage Subscription
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50 gap-4">
            <div>
              <span className="text-xs text-muted-foreground">Available Credit Balance</span>
              <p className="text-2xl font-bold text-primary">{credits.toLocaleString()} Credits</p>
            </div>
            <span className="text-xs text-muted-foreground max-w-xs">
              Credits never expire. Subscriptions add a new allocation every billing cycle.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Instant Credit Top-Up Packs */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Instant Credit Packs (Prepaid)</h2>
          <p className="text-xs text-muted-foreground">
            No recurring commitment. Purchase synthesis characters as needed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CREDIT_PACKS.map((pack) => (
            <Card
              key={pack.id}
              className={`border transition-all duration-200 ${
                pack.popular
                  ? "border-primary shadow-glow bg-card/90"
                  : "border-border/60 bg-card/60"
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{pack.name}</CardTitle>
                  {pack.popular && (
                    <Badge variant="glow" size="sm">
                      Best Value
                    </Badge>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-foreground">${pack.priceUsd}</span>
                  <span className="text-xs text-muted-foreground"> / one-time</span>
                </div>
                <CardDescription className="text-xs mt-1">
                  +{pack.credits.toLocaleString()} synthesis credits
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-0">
                <Button
                  variant={pack.popular ? "primary" : "secondary"}
                  size="md"
                  fullWidth
                  onClick={() => handleBuyCreditPack(pack.id)}
                  isLoading={loadingAction === `pack-${pack.id}`}
                >
                  Buy {pack.credits.toLocaleString()} Credits
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Recurring Monthly Subscription Plans */}
      <div className="space-y-4 pt-6 border-t border-border/40">
        <div>
          <h2 className="text-xl font-bold text-foreground">Monthly Pro Memberships</h2>
          <p className="text-xs text-muted-foreground">
            Unlock higher monthly quotas, voice cloning slots, and commercial broadcast rights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(["CREATOR", "PRO"] as const).map((tierKey) => {
            const plan = SUBSCRIPTION_PLANS[tierKey];
            const isCurrent = currentTier === tierKey;

            return (
              <Card
                key={plan.id}
                className={`border transition-all duration-200 ${
                  isCurrent ? "border-success bg-card/90" : "border-border/60 bg-card/60"
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {isCurrent ? (
                      <Badge variant="success" size="sm">
                        Current Plan
                      </Badge>
                    ) : (
                      <Badge variant="primary" size="sm">
                        Monthly
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-foreground">
                      ${plan.priceMonthlyUsd}
                    </span>
                    <span className="text-xs text-muted-foreground"> / month</span>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    Includes {plan.monthlyCredits.toLocaleString()} monthly credits &{" "}
                    {plan.voiceClones} voice clones
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <svg
                          className="w-3.5 h-3.5 text-primary shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    variant={isCurrent ? "outline" : "primary"}
                    size="md"
                    fullWidth
                    disabled={isCurrent}
                    onClick={() => handleCheckoutSubscription(tierKey)}
                    isLoading={loadingAction === `sub-${tierKey}`}
                  >
                    {isCurrent ? "Active Plan" : `Upgrade to ${plan.name}`}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
