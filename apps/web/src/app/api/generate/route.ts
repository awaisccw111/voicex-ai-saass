import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma, GenerationStatus, TransactionType } from "@saas/db";
import { rateLimit } from "@/lib/rate-limit";
import { generateFishAudioTTS } from "@/server/fish-audio";
import { uploadAudioBuffer } from "@/server/storage";

const generateRequestSchema = z.object({
  text: z
    .string()
    .min(1, "Text prompt cannot be empty")
    .max(5000, "Text exceeds maximum limit of 5,000 characters per synthesis"),
  voiceId: z.string().min(1, "Voice ID is required"),
  format: z.enum(["mp3", "wav", "ogg"]).default("mp3"),
  speed: z.number().min(0.5).max(2.0).optional(),
  pitch: z.number().min(-12).max(12).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "You must be signed in to generate voiceovers.",
            statusCode: 401,
          },
        },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // Rate Limiting
    const rateCheck = await rateLimit(`gen:${userId}`, 30, 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Rate limit exceeded. Please wait a moment before generating another voice clip.",
            statusCode: 429,
          },
        },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parseResult = generateRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parseResult.error.errors[0]?.message ?? "Invalid generation payload",
            statusCode: 400,
          },
        },
        { status: 400 },
      );
    }

    const { text, voiceId, format, speed } = parseResult.data;

    // Calculate required credits: 1 credit per 5 characters (minimum 10 credits)
    const requiredCredits = Math.max(10, Math.ceil(text.length / 5));

    // Fetch user from DB to verify real-time credit balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, credits: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User account could not be found.",
            statusCode: 404,
          },
        },
        { status: 404 },
      );
    }

    if (user.credits < requiredCredits) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_CREDITS",
            message: `Insufficient credits. Required: ${requiredCredits}, Available: ${user.credits}. Please top up credits.`,
            statusCode: 402,
          },
        },
        { status: 402 },
      );
    }

    // Atomically debit credits and create VoiceGeneration record
    const [updatedUser, generation] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          credits: { decrement: requiredCredits },
        },
      }),
      prisma.voiceGeneration.create({
        data: {
          userId,
          text,
          voiceId,
          status: GenerationStatus.PENDING,
          format,
          creditsUsed: requiredCredits,
        },
      }),
      prisma.creditTransaction.create({
        data: {
          userId,
          amount: requiredCredits,
          type: TransactionType.USAGE,
          description: `Voice synthesis (${voiceId}) for ${text.length} characters`,
        },
      }),
    ]);

    // Execute direct synthesis
    try {
      const ttsResult = await generateFishAudioTTS({
        text,
        voiceId,
        format,
        speed,
      });

      const filename = `${generation.id}.${format}`;
      const audioUrl = await uploadAudioBuffer(
        ttsResult.audioBuffer,
        filename,
        ttsResult.contentType,
      );

      const completedGen = await prisma.voiceGeneration.update({
        where: { id: generation.id },
        data: {
          status: GenerationStatus.COMPLETED,
          audioUrl,
          duration: ttsResult.durationSeconds,
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            generationId: completedGen.id,
            status: "COMPLETED",
            audioUrl: completedGen.audioUrl,
            durationSeconds: completedGen.duration ?? ttsResult.durationSeconds,
            creditsDeducted: requiredCredits,
            creditsRemaining: updatedUser.credits,
            createdAt: completedGen.createdAt.toISOString(),
          },
        },
        { status: 200 },
      );
    } catch (synthError: unknown) {
      // Refund credits on synthesis error
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: requiredCredits } },
        }),
        prisma.voiceGeneration.update({
          where: { id: generation.id },
          data: {
            status: GenerationStatus.FAILED,
            errorMessage:
              synthError instanceof Error ? synthError.message : "Synthesis failed",
          },
        }),
        prisma.creditTransaction.create({
          data: {
            userId,
            amount: requiredCredits,
            type: TransactionType.REFUND,
            description: `Refund for failed synthesis ${generation.id}`,
          },
        }),
      ]);

      throw synthError;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal generation failure";
    // eslint-disable-next-line no-console
    console.error("[API:Generate] Error executing generation:", message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "GENERATION_ERROR",
          message,
          statusCode: 500,
        },
      },
      { status: 500 },
    );
  }
}
