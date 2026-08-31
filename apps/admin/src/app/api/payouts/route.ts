import { NextResponse } from "next/server";
import { prisma, PayoutStatus } from "@saas/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "SUPERADMIN" && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as PayoutStatus | null;

    const payouts = await prisma.payoutRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        collaborator: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ payouts });
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "SUPERADMIN" && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status, adminNotes } = await req.json();

    if (!id || !status || !["PENDING", "COMPLETED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const updated = await prisma.payoutRequest.update({
      where: { id },
      data: { 
        status: status as PayoutStatus,
        ...(adminNotes ? { adminNotes } : {})
      },
      include: {
        collaborator: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    // If rejected, we might want to refund the collaborator's availableBalance.
    // For now, keep it simple.

    return NextResponse.json({ payout: updated });
  } catch (error) {
    console.error("Error updating payout:", error);
    return NextResponse.json({ error: "Failed to update payout" }, { status: 500 });
  }
}
