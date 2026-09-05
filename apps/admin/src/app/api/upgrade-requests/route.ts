import { NextResponse } from "next/server";
import { prisma, SubscriptionTier, TransactionType } from "@saas/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "PENDING";

    const requests = await prisma.upgradeRequest.findMany({
      where: status !== "ALL" ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : undefined,
      include: {
        user: {
          select: { id: true, name: true, email: true, tier: true, credits: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// Credit allocations per plan
const PLAN_CREDITS: Record<string, number> = {
  "Creator Plan": 25000,
  "Pro Plan": 150000,
  "Enterprise Plan": 500000,
};

const PLAN_TIER: Record<string, SubscriptionTier> = {
  "Creator Plan": SubscriptionTier.CREATOR,
  "Pro Plan": SubscriptionTier.PRO,
  "Enterprise Plan": SubscriptionTier.ENTERPRISE,
};

export async function PUT(req: Request) {
  try {
    const { id, status, adminNotes } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const upgradeRequest = await prisma.upgradeRequest.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!upgradeRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (status === "APPROVED") {
      // Find matching plan
      const planName = Object.keys(PLAN_TIER).find(k => upgradeRequest.planName.includes(k.split(" ")[0]));
      const newTier = planName ? PLAN_TIER[planName] : null;
      const credits = planName ? PLAN_CREDITS[planName] : 0;

      await prisma.$transaction([
        prisma.upgradeRequest.update({
          where: { id },
          data: { status: "APPROVED", adminNotes: adminNotes ?? "" }
        }),
        // Upgrade user tier if plan found
        ...(newTier ? [
          prisma.user.update({
            where: { id: upgradeRequest.userId },
            data: {
              tier: newTier,
              credits: { increment: credits }
            }
          }),
          prisma.creditTransaction.create({
            data: {
              userId: upgradeRequest.userId,
              amount: credits,
              type: TransactionType.BONUS,
              description: `Plan activated: ${upgradeRequest.planName} — Manual payment confirmed`,
            }
          })
        ] : []),
      ]);
    } else {
      await prisma.upgradeRequest.update({
        where: { id },
        data: { status: status as "APPROVED" | "REJECTED", adminNotes: adminNotes ?? "" }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
