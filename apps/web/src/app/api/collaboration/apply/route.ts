import { NextResponse } from "next/server";
import { prisma } from "@saas/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { socialLinks, bankDetails } = await req.json();

    if (!socialLinks || !bankDetails) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const existing = await prisma.collaborator.findUnique({
      where: { userId: session.user.id }
    });

    if (existing) {
      return NextResponse.json({ error: "Already applied" }, { status: 400 });
    }

    // Generate a unique short invite code (e.g. VOICEX-XXXXX)
    const inviteCode = "VX-" + uuidv4().substring(0, 8).toUpperCase();

    const collab = await prisma.collaborator.create({
      data: {
        userId: session.user.id,
        socialLinks,
        bankDetails,
        inviteCode,
        status: "PENDING",
      }
    });

    return NextResponse.json({ success: true, collaborator: collab });
  } catch (error) {
    console.error("Apply error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
