import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@saas/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "";
    const limit = parseInt(searchParams.get("limit") ?? "100", 10);

    const transactions = await prisma.creditTransaction.findMany({
      where: type ? { type: type as any } : {},
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, email: true, name: true, tier: true, credits: true } },
      },
    });

    return NextResponse.json({ success: true, data: transactions });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
