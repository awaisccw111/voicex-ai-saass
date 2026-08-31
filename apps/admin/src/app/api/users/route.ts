import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@saas/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const tier = searchParams.get("tier") ?? "";

    const users = await prisma.user.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { email: { contains: search, mode: "insensitive" } },
                  { name: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
          tier ? { tier: tier as any } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        role: true,
        credits: true,
        isSuspended: true,
        createdAt: true,
        _count: { select: { voiceGenerations: true, clonedVoices: true } },
      },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
