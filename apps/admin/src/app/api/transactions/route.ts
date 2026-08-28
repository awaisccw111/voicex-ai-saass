import { NextResponse } from "next/server";
import { prisma } from "@saas/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const where: any = {};
    if (type && type !== "ALL") {
      where.type = type;
    }

    const transactions = await prisma.creditTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            tier: true,
            credits: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: transactions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch transactions";
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}
