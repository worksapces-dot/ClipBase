import { createClient } from "@/utils/supabase/server";

// Polar product IDs
export const POLAR_PRODUCTS = {
  starter: {
    id: "5ecf8613-8e20-4ca9-bba0-bb317178c103",
    priceId: "5e8159ba-8d40-4a6a-82df-9277831aafa7",
    name: "Starter",
    clipsLimit: 10,
    price: 9,
  },
  pro: {
    id: "b7d1ecf1-3162-47f5-b6f6-fc7b327e7aa3",
    priceId: "3bfb43fe-8fc3-4e01-91cc-58ac5fd0817e",
    name: "Pro",
    clipsLimit: 50,
    price: 29,
  },
  unlimited: {
    id: "2851a3e0-4100-4390-8b74-ff7729be957c",
    priceId: "522aae8b-c735-43c6-be40-bd620c1144f1",
    name: "Unlimited",
    clipsLimit: -1, // -1 means unlimited
    price: 79,
  },
} as const;

export const PLAN_LIMITS = {
  free: 3,
  starter: 10,
  pro: 50,
  unlimited: -1,
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

const POLAR_API_URL = "https://sandbox-api.polar.sh/v1";

async function polarFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${POLAR_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Polar API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function createPolarCustomer(email: string, name?: string) {
  return polarFetch("/customers", {
    method: "POST",
    body: JSON.stringify({ email, name }),
  });
}

export async function createCheckoutSession(
  productId: string,
  customerId: string,
  successUrl: string
) {
  return polarFetch("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      product_id: productId,
      customer_id: customerId,
      success_url: successUrl,
      allow_discount_codes: true,
    }),
  });
}

export async function getCustomerSubscriptions(customerId: string) {
  return polarFetch(`/subscriptions?customer_id=${customerId}`);
}

export async function cancelSubscription(subscriptionId: string) {
  return polarFetch(`/subscriptions/${subscriptionId}`, {
    method: "PATCH",
    body: JSON.stringify({ cancel_at_period_end: true }),
  });
}

export async function getUserSubscription(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
}

export async function checkUsageLimit(userId: string): Promise<{
  canGenerate: boolean;
  used: number;
  limit: number;
  plan: PlanType;
}> {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    return { canGenerate: false, used: 0, limit: 3, plan: "free" };
  }

  const limit = subscription.clips_limit;
  const used = subscription.clips_used;
  const plan = subscription.plan as PlanType;

  // Unlimited plan
  if (limit === -1) {
    return { canGenerate: true, used, limit: -1, plan };
  }

  return {
    canGenerate: used < limit,
    used,
    limit,
    plan,
  };
}

export async function incrementUsage(userId: string, clipId: string) {
  const supabase = await createClient();

  // Get current subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!subscription) {
    throw new Error("No subscription found");
  }

  // Increment clips_used
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({ clips_used: subscription.clips_used + 1, updated_at: new Date().toISOString() })
    .eq("id", subscription.id);

  if (updateError) throw updateError;

  // Log usage event
  await supabase.from("usage_events").insert({
    user_id: userId,
    subscription_id: subscription.id,
    event_type: "clip_generated",
    clip_id: clipId,
  });
}
