import { NextResponse } from "next/server";
import { prisma } from "@saas/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const generations = await prisma.voiceGeneration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            tier: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: generations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch generations";
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}
