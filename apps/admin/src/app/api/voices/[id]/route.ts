import { NextResponse } from "next/server";
import { prisma } from "@saas/db";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const voiceId = params.id;
    const body = await req.json();

    const updated = await prisma.platformVoice.update({
      where: { id: voiceId },
      data: body,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update voice";
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const voiceId = params.id;
    await prisma.platformVoice.delete({
      where: { id: voiceId },
    });

    return NextResponse.json({ success: true, message: "Voice deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete voice";
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}
