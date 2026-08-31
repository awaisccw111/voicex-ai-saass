import { NextResponse } from "next/server";
import { prisma } from "@saas/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collab = await prisma.collaborator.findUnique({
      where: { userId: session.user.id },
      include: {
        payoutRequests: {
          orderBy: { createdAt: "desc" }
        },
        earnings: {
          orderBy: { createdAt: "desc" },
          take: 50
        }
      }
    });

    return NextResponse.json({ collaborator: collab });
  } catch (error) {
    console.error("Collab me error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
