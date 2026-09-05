import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@saas/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planName, planPrice } = await req.json();
    if (!planName || !planPrice) {
      return NextResponse.json({ error: "Missing plan details" }, { status: 400 });
    }

    // Cancel any existing PENDING requests first
    await prisma.upgradeRequest.updateMany({
      where: { userId: session.user.id, status: "PENDING" },
      data: { status: "REJECTED", adminNotes: "Replaced by new request" }
    });

    const request = await prisma.upgradeRequest.create({
      data: {
        userId: session.user.id,
        planName,
        planPrice,
        status: "PENDING"
      }
    });

    return NextResponse.json({ success: true, data: request });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pending = await prisma.upgradeRequest.findFirst({
      where: { userId: session.user.id, status: "PENDING" },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: { pending } });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
