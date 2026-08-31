import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma, SubscriptionTier, TransactionType, SubscriptionStatus } from "@saas/db";
import { verifyWebhookSignature } from "@/lib/lemonsqueezy";

// Lemon Squeezy webhook event types we handle
type LSEventName =
  | "order_created"
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_expired"
  | "subscription_resumed";

interface LSWebhookPayload {
  meta: {
    event_name: LSEventName;
    custom_data?: Record<string, string>;
  };
  data: {
    id: string;
    attributes: {
      status: string;
      total: number;
      first_order_item?: {
        variant_id: number;
      };
      variant_id?: number;
      renews_at?: string;
      ends_at?: string | null;
      product_id?: number;
    };
  };
}

// Process commission for a purchase or subscription
async function processCommission(userId: string, totalCents: number) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.invitedBy) return;

    const collab = await prisma.collaborator.findUnique({
      where: { inviteCode: user.invitedBy }
    });

    if (collab && collab.status === "APPROVED") {
      const commission = (totalCents / 100) * 0.05;

      await prisma.$transaction([
        prisma.collaborator.update({
          where: { id: collab.id },
          data: {
            availableBalance: { increment: commission },
            totalEarnings: { increment: commission },
          }
        }),
        prisma.user.update({
          where: { id: collab.userId },
          data: { credits: { increment: 1000 } }
        }),
        prisma.collaboratorEarning.create({
          data: {
            collaboratorId: collab.id,
            amount: commission,
            description: `5% commission + 1000 credits from user purchase`,
            sourceUserId: userId
          }
        })
      ]);
      console.log(`[Collab] Processed commission $${commission} for collaborator ${collab.inviteCode}`);
    }
  } catch (err) {
    console.error("Error processing commission:", err);
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headersList = headers();
  const signature = headersList.get("x-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing x-signature header" }, { status: 400 });
  }

  // Verify webhook authenticity
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error("❌ Lemon Squeezy webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: LSWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LSWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const eventName = payload.meta.event_name;
  const customData = payload.meta.custom_data ?? {};
  const userId = customData.userId;

  console.log(`📦 Lemon Squeezy webhook: ${eventName}`, { userId });

  try {
    switch (eventName) {
      // ── One-time credit pack purchase ──────────────────────────────
      case "order_created": {
        if (customData.checkoutType !== "credit_pack") break;
        if (!userId) { console.warn("order_created: no userId in custom_data"); break; }

        const creditAmount = parseInt(customData.creditAmount ?? "0", 10);
        const packId = customData.packId ?? "credit_pack";
        const orderId = payload.data.id;

        if (creditAmount > 0) {
          await prisma.$transaction([
            prisma.user.update({
              where: { id: userId },
              data: { credits: { increment: creditAmount } },
            }),
            prisma.creditTransaction.create({
              data: {
                userId,
                amount: creditAmount,
                type: TransactionType.PURCHASE,
                description: `Purchased ${creditAmount.toLocaleString()} credits (${packId}) via Lemon Squeezy`,
                stripeSessionId: orderId, // reusing this field for LS order ID
              },
            }),
          ]);
          console.log(`✅ Added ${creditAmount} credits to user ${userId}`);

          // Process affiliate commission
          await processCommission(userId, payload.data.attributes.total);
        }
        break;
      }

      // ── New subscription started ────────────────────────────────────
      case "subscription_created": {
        if (!userId) { console.warn("subscription_created: no userId"); break; }

        const planTier = (customData.planTier as SubscriptionTier) ?? SubscriptionTier.CREATOR;
        const monthlyCredits = parseInt(customData.monthlyCredits ?? "25000", 10);
        const subscriptionId = payload.data.id;
        const renewsAt = payload.data.attributes.renews_at;

        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: {
              tier: planTier,
              credits: { increment: monthlyCredits },
            },
          }),
          prisma.subscription.upsert({
            where: { stripeSubscriptionId: subscriptionId },
            create: {
              userId,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: String(payload.data.attributes.variant_id ?? ""),
              stripeCurrentPeriodEnd: renewsAt ? new Date(renewsAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              status: SubscriptionStatus.ACTIVE,
              planTier,
            },
            update: {
              status: SubscriptionStatus.ACTIVE,
              planTier,
              stripeCurrentPeriodEnd: renewsAt ? new Date(renewsAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          }),
          prisma.creditTransaction.create({
            data: {
              userId,
              amount: monthlyCredits,
              type: TransactionType.BONUS,
              description: `Monthly credit allocation for ${planTier} plan (Lemon Squeezy)`,
              stripeSessionId: subscriptionId,
            },
          }),
        ]);
        console.log(`✅ Subscription created: ${planTier} for user ${userId}`);

        // Process affiliate commission
        await processCommission(userId, payload.data.attributes.total);
        break;
      }

      // ── Subscription renewed (monthly) ─────────────────────────────
      case "subscription_updated": {
        const subscriptionId = payload.data.id;
        const renewsAt = payload.data.attributes.renews_at;
        const status = payload.data.attributes.status;

        const dbStatus = status === "active" ? SubscriptionStatus.ACTIVE
          : status === "past_due" ? SubscriptionStatus.PAST_DUE
          : status === "cancelled" ? SubscriptionStatus.CANCELED
          : SubscriptionStatus.ACTIVE;

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscriptionId },
          data: {
            status: dbStatus,
            ...(renewsAt ? { stripeCurrentPeriodEnd: new Date(renewsAt) } : {}),
          },
        });
        console.log(`🔄 Subscription ${subscriptionId} updated: ${status}`);
        break;
      }

      // ── Subscription cancelled ─────────────────────────────────────
      case "subscription_cancelled":
      case "subscription_expired": {
        const subscriptionId = payload.data.id;

        const existingSub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscriptionId },
        });

        if (existingSub) {
          await prisma.$transaction([
            prisma.subscription.update({
              where: { id: existingSub.id },
              data: { status: SubscriptionStatus.CANCELED },
            }),
            prisma.user.update({
              where: { id: existingSub.userId },
              data: { tier: SubscriptionTier.FREE },
            }),
          ]);
          console.log(`🚫 Subscription ${subscriptionId} cancelled → user downgraded to FREE`);
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled Lemon Squeezy event: ${eventName}`);
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Lemon Squeezy webhook error (${eventName}):`, msg);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
