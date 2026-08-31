import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@saas/db";
import { getPortalUrl } from "@/lib/lemonsqueezy";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ success: false, error: { message: "User not found" } }, { status: 404 });
    }

    const portalUrl = await getPortalUrl(user.email);
    if (!portalUrl) {
      return NextResponse.json({
        success: false,
        error: { message: "No active Lemon Squeezy subscription found for this account." },
      }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { url: portalUrl } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get portal URL";
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}
