import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@saas/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { action, value } = body;
    const userId = params.id;

    switch (action) {
      case "SET_TIER": {
        const updated = await prisma.user.update({
          where: { id: userId },
          data: { tier: value },
        });
        return NextResponse.json({ success: true, data: updated });
      }

      case "ADD_CREDITS": {
        const amount = parseInt(value, 10);
        const updated = await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { credits: { increment: amount } },
          }),
          prisma.creditTransaction.create({
            data: {
              userId,
              amount,
              type: "BONUS",
              description: `Admin bonus grant: +${amount} credits`,
            },
          }),
        ]);
        return NextResponse.json({ success: true, data: updated[0] });
      }

      case "DEDUCT_CREDITS": {
        const amount = parseInt(value, 10);
        const updated = await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: amount } },
          }),
          prisma.creditTransaction.create({
            data: {
              userId,
              amount,
              type: "USAGE",
              description: `Admin deduction: -${amount} credits`,
            },
          }),
        ]);
        return NextResponse.json({ success: true, data: updated[0] });
      }

      case "TOGGLE_SUSPEND": {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const updated = await prisma.user.update({
          where: { id: userId },
          data: { isSuspended: !user?.isSuspended },
        });
        return NextResponse.json({ success: true, data: updated });
      }

      case "SET_ROLE": {
        const updated = await prisma.user.update({
          where: { id: userId },
          data: { role: value },
        });
        return NextResponse.json({ success: true, data: updated });
      }

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
