import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@saas/db";
import {
  createCheckoutUrl,
  SUBSCRIPTION_PLANS,
  CREDIT_PACKS,
} from "@/lib/lemonsqueezy";
import { z } from "zod";

const checkoutSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("subscription"), planId: z.enum(["CREATOR", "PRO"]) }),
  z.object({ type: z.literal("credit_pack"), packId: z.enum(["credits_1k", "credits_5k", "credits_20k"]) }),
]);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Sign in required." } }, { status: 401 });
    }

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0]?.message } }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "User not found." } }, { status: 404 });
    }

    const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "https://voicex-ai-saass-web-two.vercel.app";
    const payload = parsed.data;

    if (payload.type === "subscription") {
      const plan = SUBSCRIPTION_PLANS[payload.planId];
      if (!plan.variantId) {
        return NextResponse.json({ success: false, error: { code: "NOT_CONFIGURED", message: "Payment not configured yet. Contact support." } }, { status: 503 });
      }

      const url = await createCheckoutUrl({
        variantId: plan.variantId,
        email: user.email,
        name: user.name,
        customData: {
          userId: user.id,
          checkoutType: "subscription",
          planTier: plan.id,
          monthlyCredits: String(plan.monthlyCredits),
        },
        successUrl: `${origin}/dashboard/settings?checkout=success&type=subscription`,
      });

      return NextResponse.json({ success: true, data: { url } });
    } else {
      const pack = CREDIT_PACKS.find((p) => p.id === payload.packId);
      if (!pack) {
        return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Pack not found." } }, { status: 404 });
      }
      if (!pack.variantId) {
        return NextResponse.json({ success: false, error: { code: "NOT_CONFIGURED", message: "Payment not configured yet. Contact support." } }, { status: 503 });
      }

      const url = await createCheckoutUrl({
        variantId: pack.variantId,
        email: user.email,
        name: user.name,
        customData: {
          userId: user.id,
          checkoutType: "credit_pack",
          packId: pack.id,
          creditAmount: String(pack.credits),
        },
        successUrl: `${origin}/dashboard/settings?checkout=success&type=credits&amount=${pack.credits}`,
      });

      return NextResponse.json({ success: true, data: { url } });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: { code: "CHECKOUT_ERROR", message } }, { status: 500 });
  }
}
