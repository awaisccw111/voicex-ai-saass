import * as React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@saas/db";
import { Spinner } from "@saas/ui";
import { BillingClient } from "./billing-client";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/settings");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
        take: 1,
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const activeSub = user.subscriptions[0];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Billing & Subscription Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your subscription plans, buy instant credit packs, and update payment methods.
        </p>
      </div>

      <React.Suspense
        fallback={
          <div className="flex items-center justify-center p-16 bg-card rounded-xl border border-border">
            <Spinner size="lg" color="primary" />
          </div>
        }
      >
        <BillingClient
          currentTier={user.tier}
          credits={user.credits}
          hasStripeCustomer={Boolean(user.stripeCustomerId)}
          periodEnd={activeSub?.stripeCurrentPeriodEnd.toLocaleDateString()}
        />
      </React.Suspense>
    </div>
  );
}
