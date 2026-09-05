"use client";

import * as React from "react";
import toast from "react-hot-toast";
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

const WHATSAPP_NUMBER = "923424153171";

const PLANS = [
  {
    id: "CREATOR",
    name: "Creator Plan",
    price: "$19/month",
    credits: 25000,
    voiceClones: 3,
    features: [
      "25,000 monthly synthesis credits",
      "3 custom voice clones",
      "120+ AI neural voices",
      "Commercial broadcast license",
      "Priority generation queue",
    ],
  },
  {
    id: "PRO",
    name: "Pro Plan",
    price: "$49/month",
    credits: 150000,
    voiceClones: "Unlimited",
    features: [
      "150,000 monthly synthesis credits",
      "Unlimited voice clones",
      "120+ AI neural voices",
      "Full commercial license",
      "Dedicated generation queue",
      "API access",
    ],
    popular: true,
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise Plan",
    price: "Custom",
    credits: 0,
    voiceClones: "Unlimited",
    features: [
      "Unlimited synthesis credits",
      "Unlimited voice clones",
      "Dedicated infrastructure",
      "White-label options",
      "SLA guarantee",
      "24/7 priority support",
    ],
  },
];

const CREDIT_PACKS = [
  { id: "starter", name: "Starter Pack", credits: 10000, price: "$5" },
  { id: "growth", name: "Growth Pack", credits: 50000, price: "$20", popular: true },
  { id: "scale", name: "Scale Pack", credits: 150000, price: "$50" },
];

export interface BillingClientProps {
  readonly currentTier: "FREE" | "CREATOR" | "PRO" | "ENTERPRISE";
  readonly credits: number;
  readonly userEmail: string;
  readonly userName: string;
}

export const BillingClient: React.FC<BillingClientProps> = ({
  currentTier,
  credits,
  userEmail,
  userName,
}) => {
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [pendingRequest, setPendingRequest] = React.useState<string | null>(null);

  // Check if user has a pending request
  React.useEffect(() => {
    fetch("/api/upgrade-request")
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.pending) setPendingRequest(d.data.pending.planName);
      })
      .catch(() => {});
  }, []);

  const handleUpgrade = async (planName: string, planPrice: string, type: "plan" | "pack") => {
    const actionKey = `${type}-${planName}`;
    setLoadingAction(actionKey);

    try {
      // 1. Create upgrade request in DB
      await fetch("/api/upgrade-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName, planPrice }),
      });

      // 2. Open WhatsApp with pre-filled message
      const message = encodeURIComponent(
        `Hi! I'd like to upgrade my VOICEX AI account.\n\n` +
        `Plan: ${planName} - ${planPrice}\n` +
        `Email: ${userEmail}\n` +
        `Name: ${userName}\n\n` +
        `Please confirm payment details. Thank you!`
      );
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");

      setPendingRequest(planName);
      toast.success("WhatsApp opened! Your upgrade request has been submitted. We'll activate it after payment confirmation.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Pending Request Banner */}
      {pendingRequest && (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
          <span className="text-xl">⏳</span>
          <div>
            <p className="text-sm font-semibold text-yellow-400">Upgrade Request Pending</p>
            <p className="text-xs text-yellow-400/70">
              Your request for <strong>{pendingRequest}</strong> is being reviewed. Once you send payment via WhatsApp, we&apos;ll activate it within minutes.
            </p>
          </div>
        </div>
      )}

      {/* Current Plan Card */}
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
                  ? "You are on the Free tier (1,000 complimentary starter credits)."
                  : `Active ${currentTier} subscription`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50 gap-4">
            <div>
              <span className="text-xs text-muted-foreground">Available Credit Balance</span>
              <p className="text-2xl font-bold text-primary">{credits.toLocaleString()} Credits</p>
            </div>
            <span className="text-xs text-muted-foreground max-w-xs">
              Credits never expire. Plans add a new allocation each month.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">💬 How to Upgrade</h3>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Click any plan below — WhatsApp will open with your details pre-filled</li>
          <li>Send the message to our team and complete payment</li>
          <li>Your account is upgraded within minutes after payment confirmation</li>
        </ol>
      </div>

      {/* Monthly Plans */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Monthly Pro Memberships</h2>
          <p className="text-xs text-muted-foreground">
            Unlock higher quotas, voice cloning, and commercial rights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = currentTier === plan.id;
            return (
              <Card
                key={plan.id}
                className={`border transition-all duration-200 ${
                  isCurrent
                    ? "border-green-500/50 bg-card/90"
                    : plan.popular
                    ? "border-primary shadow-glow bg-card/90"
                    : "border-border/60 bg-card/60"
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {isCurrent ? (
                      <Badge variant="success" size="sm">Current</Badge>
                    ) : plan.popular ? (
                      <Badge variant="glow" size="sm">Popular</Badge>
                    ) : null}
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-foreground">{plan.price.split("/")[0]}</span>
                    {plan.price.includes("/") && <span className="text-xs text-muted-foreground"> /month</span>}
                  </div>
                  <CardDescription className="text-xs mt-1">
                    {plan.credits > 0 ? `${plan.credits.toLocaleString()} monthly credits` : "Custom credits"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
                    isLoading={loadingAction === `plan-${plan.id}`}
                    onClick={() => handleUpgrade(plan.name, plan.price, "plan")}
                  >
                    {isCurrent ? "✅ Active Plan" : `💬 Upgrade via WhatsApp`}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Credit Packs */}
      <div className="space-y-4 pt-6 border-t border-border/40">
        <div>
          <h2 className="text-xl font-bold text-foreground">Instant Credit Packs (Prepaid)</h2>
          <p className="text-xs text-muted-foreground">No subscription. Buy extra credits anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CREDIT_PACKS.map((pack) => (
            <Card
              key={pack.id}
              className={`border transition-all duration-200 ${
                pack.popular ? "border-primary shadow-glow bg-card/90" : "border-border/60 bg-card/60"
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{pack.name}</CardTitle>
                  {pack.popular && <Badge variant="glow" size="sm">Best Value</Badge>}
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-foreground">{pack.price}</span>
                  <span className="text-xs text-muted-foreground"> one-time</span>
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
                  isLoading={loadingAction === `pack-${pack.id}`}
                  onClick={() => handleUpgrade(`${pack.name} (+${pack.credits.toLocaleString()} credits)`, pack.price, "pack")}
                >
                  💬 Buy via WhatsApp
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
