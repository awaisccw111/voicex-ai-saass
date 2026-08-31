import { NextResponse } from "next/server";
import { prisma, TransactionType } from "@saas/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    
    if (user?.invitedBy) {
      return NextResponse.json({ error: "You have already redeemed an invite code" }, { status: 400 });
    }

    const collab = await prisma.collaborator.findUnique({
      where: { inviteCode: code }
    });

    if (!collab || collab.status !== "APPROVED") {
      return NextResponse.json({ error: "Invalid or inactive invite code" }, { status: 400 });
    }

    if (collab.userId === user?.id) {
      return NextResponse.json({ error: "You cannot redeem your own code" }, { status: 400 });
    }

    // Give user 500 credits and link them
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { 
          invitedBy: collab.inviteCode,
          credits: { increment: 500 }
        }
      }),
      prisma.creditTransaction.create({
        data: {
          userId: session.user.id,
          amount: 500,
          type: TransactionType.BONUS,
          description: `Redeemed invite code: ${code}`
        }
      }),
      prisma.collaborator.update({
        where: { id: collab.id },
        data: { totalInvites: { increment: 1 } }
      })
    ]);

    return NextResponse.json({ success: true, creditsAdded: 500 });
  } catch (error) {
    console.error("Redeem error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
