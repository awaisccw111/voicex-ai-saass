/**
 * Lemon Squeezy integration using direct REST API calls.
 * Docs: https://docs.lemonsqueezy.com/api
 */

const LS_API_BASE = "https://api.lemonsqueezy.com/v1";

function lsHeaders() {
  const key = process.env.LEMONSQUEEZY_API_KEY;
  if (!key) throw new Error("LEMONSQUEEZY_API_KEY is not set");
  return {
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
    Authorization: `Bearer ${key}`,
  };
}

export interface LSPlan {
  readonly id: "CREATOR" | "PRO";
  readonly name: string;
  readonly priceMonthlyUsd: number;
  readonly variantId: string;
  readonly monthlyCredits: number;
  readonly voiceClones: number;
  readonly features: readonly string[];
}

export interface LSCreditPack {
  readonly id: "credits_1k" | "credits_5k" | "credits_20k";
  readonly name: string;
  readonly credits: number;
  readonly priceUsd: number;
  readonly variantId: string;
  readonly popular?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<"CREATOR" | "PRO", LSPlan> = {
  CREATOR: {
    id: "CREATOR",
    name: "Creator Plan",
    priceMonthlyUsd: 19,
    variantId: process.env.LEMONSQUEEZY_VARIANT_CREATOR ?? "",
    monthlyCredits: 25000,
    voiceClones: 3,
    features: [
      "25,000 monthly synthesis credits",
      "3 Instant Voice Clones",
      "All Neural Voices & Accents",
      "Commercial Monetization License",
      "Priority Audio Processing Queue",
    ],
  },
  PRO: {
    id: "PRO",
    name: "Pro Studio Plan",
    priceMonthlyUsd: 49,
    variantId: process.env.LEMONSQUEEZY_VARIANT_PRO ?? "",
    monthlyCredits: 100000,
    voiceClones: 15,
    features: [
      "100,000 monthly synthesis credits",
      "15 High-Fidelity Voice Clones",
      "Emotion & Cadence Directing",
      "Full API & Webhook Access",
      "Dedicated Enterprise Support",
      "Zero-Retention Privacy Option",
    ],
  },
};

export const CREDIT_PACKS: readonly LSCreditPack[] = [
  {
    id: "credits_1k",
    name: "Starter Pack",
    credits: 1000,
    priceUsd: 9,
    variantId: process.env.LEMONSQUEEZY_VARIANT_CREDITS_1K ?? "",
  },
  {
    id: "credits_5k",
    name: "Creator Pack",
    credits: 5000,
    priceUsd: 39,
    variantId: process.env.LEMONSQUEEZY_VARIANT_CREDITS_5K ?? "",
    popular: true,
  },
  {
    id: "credits_20k",
    name: "Studio Pack",
    credits: 20000,
    priceUsd: 129,
    variantId: process.env.LEMONSQUEEZY_VARIANT_CREDITS_20K ?? "",
  },
];

/**
 * Create a Lemon Squeezy checkout URL for a variant.
 * Attaches custom data (userId, checkoutType, etc.) to the checkout.
 */
export async function createCheckoutUrl(params: {
  variantId: string;
  email: string;
  name?: string | null;
  customData: Record<string, string>;
  successUrl: string;
  cancelUrl?: string;
}): Promise<string> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) throw new Error("LEMONSQUEEZY_STORE_ID is not set");

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: params.email,
          name: params.name ?? undefined,
          custom: params.customData,
        },
        product_options: {
          redirect_url: params.successUrl,
        },
        checkout_options: {
          embed: false,
        },
      },
      relationships: {
        store: {
          data: { type: "stores", id: storeId },
        },
        variant: {
          data: { type: "variants", id: params.variantId },
        },
      },
    },
  };

  const res = await fetch(`${LS_API_BASE}/checkouts`, {
    method: "POST",
    headers: lsHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lemon Squeezy checkout creation failed: ${err}`);
  }

  const json = await res.json();
  const url = json?.data?.attributes?.url as string | undefined;
  if (!url) throw new Error("No checkout URL returned from Lemon Squeezy");

  return url;
}

/**
 * Get the Lemon Squeezy customer portal URL for a subscriber.
 * Returns null if not found.
 */
export async function getPortalUrl(email: string): Promise<string | null> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) return null;

  const res = await fetch(
    `${LS_API_BASE}/customers?filter[store_id]=${storeId}&filter[email]=${encodeURIComponent(email)}`,
    { headers: lsHeaders() }
  );

  if (!res.ok) return null;

  const json = await res.json();
  const portalUrl = json?.data?.[0]?.attributes?.urls?.customer_portal as string | undefined;
  return portalUrl ?? null;
}

/**
 * Verify a Lemon Squeezy webhook signature.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return false;

  // Node.js 20+ has built-in crypto
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto") as typeof import("crypto");
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hmac, "hex"),
    Buffer.from(signature, "hex")
  );
}
