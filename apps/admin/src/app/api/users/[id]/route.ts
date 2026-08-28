import { NextResponse } from "next/server";
import { prisma, TransactionType } from "@saas/db";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const userId = params.id;
    const body = await req.json();

    const { tier, creditDelta, isSuspended, role } = body;

    const dataToUpdate: any = {};

    if (tier) {
      dataToUpdate.tier = tier;
    }
    if (typeof isSuspended === "boolean") {
      dataToUpdate.isSuspended = isSuspended;
    }
    if (role) {
      dataToUpdate.role = role;
    }

    // If credit adjustment is requested
    if (typeof creditDelta === "number" && creditDelta !== 0) {
      const updatedUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id: userId },
          data: {
            ...dataToUpdate,
            credits: {
              increment: creditDelta,
            },
          },
        });

        await tx.creditTransaction.create({
          data: {
            userId,
            amount: Math.abs(creditDelta),
            type: creditDelta > 0 ? TransactionType.BONUS : TransactionType.USAGE,
            description: `Admin manual credit adjustment (${creditDelta > 0 ? "+" : ""}${creditDelta})`,
          },
        });

        return user;
      });

      return NextResponse.json({ success: true, data: updatedUser });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const userId = params.id;
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete user";
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}
