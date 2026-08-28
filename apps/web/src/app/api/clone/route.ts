import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, TransactionType } from "@saas/db";

const CLONE_CREDIT_COST = 50;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
        { status: 401 },
      );
    }

    const clonedVoices = await prisma.clonedVoice.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: clonedVoices });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch cloned voices";
    return NextResponse.json(
      { success: false, error: { message, code: "FETCH_ERROR" } },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // Check user credit balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, credits: true },
    });

    if (!user || user.credits < CLONE_CREDIT_COST) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Insufficient credits. Voice cloning requires ${CLONE_CREDIT_COST} credits. Available: ${user?.credits ?? 0}.`,
            code: "INSUFFICIENT_CREDITS",
          },
        },
        { status: 402 },
      );
    }

    const formData = await req.formData();
    const name = (formData.get("name") as string) || "My Cloned Voice";
    const language = (formData.get("language") as string) || "en-US";
    const gender = (formData.get("gender") as string) || "neutral";
    const description = (formData.get("description") as string) || "";
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Please provide an audio sample for voice cloning.", code: "MISSING_AUDIO" },
        },
        { status: 400 },
      );
    }

    const apiKey = process.env.FISH_AUDIO_API_KEY;
    let fishAudioId = `clone_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Call Fish Audio Model Creation API if real key is configured
    if (apiKey && apiKey !== "mock_fish_audio_api_key_placeholder") {
      try {
        const fishFormData = new FormData();
        fishFormData.append("type", "tts");
        fishFormData.append("title", name);
        fishFormData.append("visibility", "private");
        fishFormData.append("train_mode", "fast");
        fishFormData.append("voices", audioFile, "sample.wav");

        const fishRes = await fetch("https://api.fish.audio/model", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: fishFormData,
        });

        if (fishRes.ok) {
          const fishData = (await fishRes.json()) as { id?: string; _id?: string };
          fishAudioId = fishData.id ?? fishData._id ?? fishAudioId;
        } else {
          const errorText = await fishRes.text();
          // eslint-disable-next-line no-console
          console.warn("[FishAudio:Clone] API warning:", errorText);
        }
      } catch (fishErr) {
        // eslint-disable-next-line no-console
        console.error("[FishAudio:Clone] API request error:", fishErr);
      }
    }

    // Deduct credits and save ClonedVoice to PostgreSQL
    const [updatedUser, clonedVoice] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: CLONE_CREDIT_COST } },
      }),
      prisma.creditTransaction.create({
        data: {
          userId,
          amount: CLONE_CREDIT_COST,
          type: TransactionType.USAGE,
          description: `Voice cloning creation: ${name}`,
        },
      }),
      prisma.clonedVoice.create({
        data: {
          userId,
          fishAudioId,
          name,
          gender,
          language,
          description,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        voice: clonedVoice,
        creditsDeducted: CLONE_CREDIT_COST,
        creditsRemaining: updatedUser.credits,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Voice cloning failed";
    // eslint-disable-next-line no-console
    console.error("[API:Clone] Error:", message);
    return NextResponse.json(
      { success: false, error: { message, code: "CLONE_ERROR" } },
      { status: 500 },
    );
  }
}
