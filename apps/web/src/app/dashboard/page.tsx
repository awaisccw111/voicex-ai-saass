import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@saas/db";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from "@saas/ui";
import { formatRelativeTime } from "@saas/core";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  // Fetch full user profile, subscription, and recent transactions
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
        take: 1,
      },
      creditTransactions: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const activeSub = user.subscriptions[0];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {user.name ?? "Creator"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your acoustic generation quota, recent projects, and active subscription.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/settings">
            <Button variant="secondary" size="md">
              Buy Credits
            </Button>
          </Link>
          <Link href="/dashboard/studio">
            <Button
              variant="primary"
              size="md"
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            >
              Open AI Studio
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Credits Card */}
        <Card className="border-border/60 bg-card/70 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Available Credits
              </span>
              <Badge variant="glow" size="sm">
                Live
              </Badge>
            </div>
            <CardTitle className="text-3xl font-bold text-primary mt-2">
              {user.credits.toLocaleString()}
            </CardTitle>
            <CardDescription className="text-xs">
              ≈ {Math.floor(user.credits / 150)} minutes of studio synthesis
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/dashboard/settings" className="w-full">
              <Button variant="outline" size="sm" fullWidth>
                Top-Up Credits →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Active Subscription Tier Card */}
        <Card className="border-border/60 bg-card/70 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Plan
              </span>
              <Badge variant={user.tier === "FREE" ? "secondary" : "success"} size="sm">
                {user.tier}
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground mt-2">
              {user.tier === "FREE" ? "Free Tier" : `${user.tier} Plan`}
            </CardTitle>
            <CardDescription className="text-xs">
              {activeSub
                ? `Renews on ${activeSub.stripeCurrentPeriodEnd.toLocaleDateString()}`
                : "Upgrade for 25k monthly credits & cloning"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/dashboard/settings" className="w-full">
              <Button variant="secondary" size="sm" fullWidth>
                {user.tier === "FREE" ? "Upgrade Plan →" : "Manage Subscription →"}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Studio Quick Launcher */}
        <Card className="border-border/60 bg-gradient-to-br from-primary/10 via-card/80 to-card">
          <CardHeader>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Quick Action
            </span>
            <CardTitle className="text-xl font-bold text-foreground mt-2">
              Synthesize Speech
            </CardTitle>
            <CardDescription className="text-xs">
              Launch the full neural voice studio with 120+ vocal models
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/dashboard/studio" className="w-full">
              <Button variant="primary" size="sm" fullWidth>
                Launch Studio Workspace →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / Transactions Section */}
      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Credit Transactions</CardTitle>
              <CardDescription>
                Auditable ledger of your credit grants, purchases, and usage
              </CardDescription>
            </div>
            <Badge variant="outline" size="sm">
              {user.creditTransactions.length} events
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {user.creditTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No transactions recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-border/40">
              {user.creditTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="py-3.5 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        tx.type === "PURCHASE" || tx.type === "BONUS"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tx.type === "PURCHASE" || tx.type === "BONUS" ? "+" : "-"}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {tx.description ?? `${tx.type} Transaction`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(tx.createdAt.toISOString())} • ID: {tx.id.slice(-8)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono font-bold ${
                        tx.type === "PURCHASE" || tx.type === "BONUS"
                          ? "text-success"
                          : "text-foreground"
                      }`}
                    >
                      {tx.type === "PURCHASE" || tx.type === "BONUS" ? "+" : "-"}
                      {tx.amount.toLocaleString()} Credits
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
