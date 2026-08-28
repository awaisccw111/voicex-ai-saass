import { NextResponse } from "next/server";
import { prisma } from "@saas/db";

export async function GET() {
  try {
    const voices = await prisma.platformVoice.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ success: true, data: voices });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch voices";
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fishAudioId,
      name,
      gender,
      category,
      language,
      languageName,
      tags,
      isPremium,
      previewAudioUrl,
    } = body;

    if (!fishAudioId || !name) {
      return NextResponse.json(
        { success: false, error: { message: "Fish Audio ID and Name are required" } },
        { status: 400 },
      );
    }

    const createdVoice = await prisma.platformVoice.create({
      data: {
        fishAudioId,
        name,
        gender: gender || "neutral",
        category: category || "conversational",
        language: language || "en-US",
        languageName: languageName || "English (United States) 🇺🇸",
        tags: Array.isArray(tags) ? tags : [],
        isPremium: Boolean(isPremium),
        previewAudioUrl: previewAudioUrl || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: createdVoice });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create platform voice";
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}
