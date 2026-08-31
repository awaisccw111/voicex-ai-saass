import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@saas/db";

export async function GET() {
  try {
    const voices = await prisma.platformVoice.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ success: true, data: voices });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const voice = await prisma.platformVoice.create({
      data: {
        fishAudioId: body.fishAudioId,
        name: body.name,
        gender: body.gender ?? "neutral",
        category: body.category ?? "conversational",
        language: body.language ?? "en-US",
        languageName: body.languageName ?? "English (United States) 🇺🇸",
        tags: body.tags ?? [],
        isPremium: body.isPremium ?? false,
        isActive: true,
        order: body.order ?? 99,
      },
    });
    return NextResponse.json({ success: true, data: voice });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
