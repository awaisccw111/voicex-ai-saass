import { NextResponse } from "next/server";
import { prisma, CollaborationStatus } from "@saas/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "SUPERADMIN" && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as CollaborationStatus | null;

    const collaborators = await prisma.collaborator.findMany({
      where: status ? { status } : undefined,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ collaborators });
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    return NextResponse.json({ error: "Failed to fetch collaborators" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "SUPERADMIN" && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await req.json();

    if (!id || !status || !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const updated = await prisma.collaborator.update({
      where: { id },
      data: { status: status as CollaborationStatus },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ collaborator: updated });
  } catch (error) {
    console.error("Error updating collaborator:", error);
    return NextResponse.json({ error: "Failed to update collaborator" }, { status: 500 });
  }
}
