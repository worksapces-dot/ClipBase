import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { POLAR_PRODUCTS, PLAN_LIMITS } from "@/lib/polar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Map Polar product IDs to plan names
const productToPlan: Record<string, keyof typeof PLAN_LIMITS> = {
  [POLAR_PRODUCTS.starter.id]: "starter",
  [POLAR_PRODUCTS.pro.id]: "pro",
  [POLAR_PRODUCTS.unlimited.id]: "unlimited",
};

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const event = payload.type;

    console.log("Polar webhook received:", event);

    switch (event) {
      case "subscription.created":
      case "subscription.updated":
        await handleSubscriptionChange(payload.data);
        break;

      case "subscription.canceled":
        await handleSubscriptionCanceled(payload.data);
        break;

      case "checkout.completed":
        await handleCheckoutCompleted(payload.data);
        break;

      default:
        console.log("Unhandled webhook event:", event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionChange(data: any) {
  const { customer_id, id: subscriptionId, product_id, status, current_period_start, current_period_end } = data;

  // Find user by polar_customer_id
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("polar_customer_id", customer_id)
    .single();

  if (!subscription) {
    console.error("No subscription found for customer:", customer_id);
    return;
  }

  const plan = productToPlan[product_id] || "free";
  const clipsLimit = PLAN_LIMITS[plan];

  await supabase
    .from("subscriptions")
    .update({
      polar_subscription_id: subscriptionId,
      plan,
      status: mapPolarStatus(status),
      clips_limit: clipsLimit,
      current_period_start,
      current_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);

  console.log(`Subscription updated: ${subscription.user_id} -> ${plan}`);
}

async function handleSubscriptionCanceled(data: any) {
  const { customer_id } = data;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("polar_customer_id", customer_id)
    .single();

  if (!subscription) return;

  // Downgrade to free at period end
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);
}

async function handleCheckoutCompleted(data: any) {
  const { customer_id, customer_email, product_id } = data;

  // Find user by email
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users.find((u) => u.email === customer_email);

  if (!user) {
    console.error("No user found for email:", customer_email);
    return;
  }

  const plan = productToPlan[product_id] || "starter";
  const clipsLimit = PLAN_LIMITS[plan];

  // Update or create subscription
  await supabase
    .from("subscriptions")
    .upsert({
      user_id: user.id,
      polar_customer_id: customer_id,
      plan,
      status: "active",
      clips_limit: clipsLimit,
      clips_used: 0, // Reset on new subscription
      current_period_start: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  console.log(`Checkout completed: ${user.email} -> ${plan}`);
}

function mapPolarStatus(polarStatus: string): string {
  const statusMap: Record<string, string> = {
    active: "active",
    canceled: "canceled",
    incomplete: "past_due",
    incomplete_expired: "canceled",
    past_due: "past_due",
    trialing: "trialing",
    unpaid: "past_due",
  };
  return statusMap[polarStatus] || "active";
}
