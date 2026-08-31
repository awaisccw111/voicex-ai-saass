import { NextResponse } from "next/server";
import { prisma } from "@saas/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, bankDetails } = await req.json();

    if (!amount || amount <= 0 || !bankDetails) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const collab = await prisma.collaborator.findUnique({
      where: { userId: session.user.id }
    });

    if (!collab || collab.status !== "APPROVED") {
      return NextResponse.json({ error: "Not an approved collaborator" }, { status: 403 });
    }

    if (collab.availableBalance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Deduct balance and create request
    const [request] = await prisma.$transaction([
      prisma.payoutRequest.create({
        data: {
          collaboratorId: collab.id,
          amount,
          bankDetails,
          status: "PENDING"
        }
      }),
      prisma.collaborator.update({
        where: { id: collab.id },
        data: { availableBalance: { decrement: amount } }
      })
    ]);

    return NextResponse.json({ success: true, request });
  } catch (error) {
    console.error("Withdraw error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
