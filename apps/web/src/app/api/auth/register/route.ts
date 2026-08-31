import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma, TransactionType } from "@saas/db";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  inviteCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const result = registerSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: result.error.errors[0]?.message ?? "Invalid input",
            statusCode: 400,
          },
        },
        { status: 400 },
      );
    }

    const { name, email, password, inviteCode } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_EXISTS",
            message: "An account with this email address already exists",
            statusCode: 409,
          },
        },
        { status: 409 },
      );
    }

    // Hash password with high salt rounds
    const passwordHash = await bcrypt.hash(password, 12);
    let initialCredits = 1000;
    
    // Check invite code if provided
    let validInviteCode = null;
    let collabId = null;
    if (inviteCode) {
      const collab = await prisma.collaborator.findUnique({
        where: { inviteCode }
      });
      if (collab && collab.status === "APPROVED") {
        validInviteCode = inviteCode;
        collabId = collab.id;
        initialCredits += 500; // Add 500 bonus credits
      }
    }

    // Create user and credit transaction atomically
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          credits: initialCredits,
          tier: "FREE",
          invitedBy: validInviteCode,
          creditTransactions: {
            create: [
              {
                amount: 1000,
                type: TransactionType.BONUS,
                description: "Welcome sign-up bonus credits",
              },
              ...(validInviteCode ? [{
                amount: 500,
                type: TransactionType.BONUS,
                description: `Redeemed invite code: ${validInviteCode}`,
              }] : [])
            ],
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          credits: true,
          tier: true,
          createdAt: true,
        },
      });

      if (validInviteCode && collabId) {
        await tx.collaborator.update({
          where: { id: collabId },
          data: { totalInvites: { increment: 1 } }
        });
      }

      return user;
    });

    return NextResponse.json(
      {
        success: true,
        data: newUser,
        timestamp: new Date().toISOString(),
        requestId: `req-${Date.now()}`,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message,
          statusCode: 500,
        },
      },
      { status: 500 },
    );
  }
}
