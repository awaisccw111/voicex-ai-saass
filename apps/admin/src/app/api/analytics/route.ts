import { NextResponse } from "next/server";
import { prisma } from "@saas/db";

export async function GET() {
  try {
    const startTime = Date.now();

    const [
      totalUsers,
      freeUsers,
      creatorUsers,
      proUsers,
      enterpriseUsers,
      generationsStats,
      creditStats,
      recentGenerations,
      activeVoicesCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { tier: "FREE" } }),
      prisma.user.count({ where: { tier: "CREATOR" } }),
      prisma.user.count({ where: { tier: "PRO" } }),
      prisma.user.count({ where: { tier: "ENTERPRISE" } }),
      prisma.voiceGeneration.aggregate({
        _count: { id: true },
        _sum: { duration: true, creditsUsed: true },
      }),
      prisma.user.aggregate({
        _sum: { credits: true },
      }),
      prisma.voiceGeneration.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, email: true, name: true, tier: true },
          },
        },
      }),
      prisma.platformVoice.count({ where: { isActive: true } }),
    ]);

    const dbLatencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          free: freeUsers,
          creator: creatorUsers,
          pro: proUsers,
          enterprise: enterpriseUsers,
          paidTotal: creatorUsers + proUsers + enterpriseUsers,
        },
        credits: {
          platformRemaining: creditStats._sum.credits ?? 0,
          totalConsumed: generationsStats._sum.creditsUsed ?? 0,
        },
        generations: {
          total: generationsStats._count.id ?? 0,
          totalDurationMinutes: Math.round(((generationsStats._sum.duration ?? 0) / 60) * 10) / 10,
        },
        system: {
          dbStatus: "HEALTHY",
          dbProvider: "Azure Managed PostgreSQL",
          dbLatencyMs,
          engine: "Fish Audio S2.1 Pro",
          activeVoicesCount,
        },
        recentGenerations,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch analytics";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}
