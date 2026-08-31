import { NextResponse } from "next/server";
import { prisma } from "@saas/db";

export async function GET() {
  try {
    // Run queries sequentially to avoid overwhelming Azure PostgreSQL connection pool
    const totalUsers = await prisma.user.count();
    const freeUsers = await prisma.user.count({ where: { tier: "FREE" } });
    const paidUsers = await prisma.user.count({ where: { tier: { not: "FREE" } } });
    const suspendedUsers = await prisma.user.count({ where: { isSuspended: true } });
    const totalGenerations = await prisma.voiceGeneration.count();
    const completedGenerations = await prisma.voiceGeneration.count({ where: { status: "COMPLETED" } });
    const failedGenerations = await prisma.voiceGeneration.count({ where: { status: "FAILED" } });
    const totalTransactions = await prisma.creditTransaction.count();

    const creditAgg = await prisma.user.aggregate({ _sum: { credits: true } });
    const totalCreditsRemaining = creditAgg._sum.credits ?? 0;

    const usageAgg = await prisma.creditTransaction.aggregate({
      where: { type: "USAGE" },
      _sum: { amount: true },
    });
    const totalCreditsConsumed = usageAgg._sum.amount ?? 0;

    const tierCounts = await prisma.user.groupBy({ by: ["tier"], _count: true });

    const recentGenerations = await prisma.voiceGeneration.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true, name: true, tier: true } } },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        freeUsers,
        paidUsers,
        suspendedUsers,
        totalGenerations,
        completedGenerations,
        failedGenerations,
        successRate:
          totalGenerations > 0
            ? Math.round((completedGenerations / totalGenerations) * 100)
            : 0,
        totalTransactions,
        totalCreditsRemaining,
        totalCreditsConsumed,
        tierBreakdown: tierCounts.map((t) => ({ tier: t.tier, count: t._count })),
        recentGenerations,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
