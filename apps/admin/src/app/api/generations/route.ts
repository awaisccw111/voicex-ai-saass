import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@saas/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "";
    const limit = parseInt(searchParams.get("limit") ?? "100", 10);

    const generations = await prisma.voiceGeneration.findMany({
      where: status ? { status: status as any } : {},
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, email: true, name: true, tier: true } },
      },
    });

    return NextResponse.json({ success: true, data: generations });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
