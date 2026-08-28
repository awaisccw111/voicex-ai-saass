import { NextResponse } from "next/server";
import { prisma } from "@saas/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const tier = searchParams.get("tier") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { id: { contains: search } },
      ];
    }
    if (tier && tier !== "ALL") {
      where.tier = tier;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            voiceGenerations: true,
            clonedVoices: true,
            creditTransactions: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch users";
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}
