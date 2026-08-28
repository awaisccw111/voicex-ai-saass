import { NextResponse } from "next/server";
import { prisma } from "@saas/db";
import { PRESET_VOICES } from "@saas/core";

export async function GET() {
  try {
    const dbVoices = await prisma.platformVoice.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    if (dbVoices.length > 0) {
      const mapped = dbVoices.map((v) => ({
        id: v.fishAudioId,
        name: v.name,
        gender: v.gender as "male" | "female" | "neutral",
        category: v.category as any,
        language: v.language as any,
        languageName: v.languageName,
        previewAudioUrl: v.previewAudioUrl || `/audio/previews/${v.name.toLowerCase()}.mp3`,
        avatarUrl: v.avatarUrl || `/avatars/${v.name.toLowerCase()}.webp`,
        supportedEmotions: ["neutral"],
        isPremium: v.isPremium,
        tags: v.tags,
      }));
      return NextResponse.json({ success: true, data: mapped });
    }

    return NextResponse.json({ success: true, data: PRESET_VOICES });
  } catch (error: unknown) {
    // Fallback to presets if DB offline
    return NextResponse.json({ success: true, data: PRESET_VOICES });
  }
}
