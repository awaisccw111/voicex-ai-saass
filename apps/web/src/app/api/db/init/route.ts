import { NextResponse } from "next/server";
import { prisma } from "@saas/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Verify connection and query user count
    const userCount = await prisma.user.count();
    return NextResponse.json({
      success: true,
      message: "Database connection verified and User table is ready!",
      userCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Database initialization check failed",
      },
      { status: 500 }
    );
  }
}
