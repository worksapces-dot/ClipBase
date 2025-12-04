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

    console.log("Polar webhook received:", event, JSON.stringify(payload.data, null, 2));

    switch (event) {
      // Subscription events
      case "subscription.created":
      case "subscription.updated":
      case "subscription.active":
        await handleSubscriptionActive(payload.data);
        break;

      case "subscription.canceled":
      case "subscription.revoked":
        await handleSubscriptionCanceled(payload.data);
        break;

      // Checkout events
      case "checkout.created":
      case "checkout.updated":
        await handleCheckout(payload.data);
        break;

      // Order events
      case "order.created":
      case "order.paid":
        await handleOrderPaid(payload.data);
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

async function handleSubscriptionActive(data: any) {
  const {
    customer_id,
    customer,
    id: subscriptionId,
    product_id,
    product,
    status,
    current_period_start,
    current_period_end,
    metadata,
  } = data;

  console.log("Handling subscription active:", { customer_id, product_id, status });

  // Get product ID from nested product object if not at top level
  const actualProductId = product_id || product?.id;
  const customerEmail = customer?.email;
  const userId = metadata?.user_id || customer?.external_id;

  // Find user subscription
  let subscription = null;

  // Try by polar_customer_id first
  if (customer_id) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("polar_customer_id", customer_id)
      .single();
    subscription = sub;
  }

  // Try by user_id from metadata
  if (!subscription && userId) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();
    subscription = sub;
  }

  // Try by email
  if (!subscription && customerEmail) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users.find((u) => u.email === customerEmail);
    if (user) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();
      subscription = sub;
    }
  }

  if (!subscription) {
    console.error("No subscription found for:", { customer_id, userId, customerEmail });
    return;
  }

  const plan = productToPlan[actualProductId] || "free";
  const clipsLimit = PLAN_LIMITS[plan];

  const { error } = await supabase
    .from("subscriptions")
    .update({
      polar_customer_id: customer_id,
      polar_subscription_id: subscriptionId,
      plan,
      status: "active",
      clips_limit: clipsLimit,
      clips_used: 0,
      current_period_start,
      current_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);

  if (error) {
    console.error("Failed to update subscription:", error);
  } else {
    console.log(`Subscription activated: ${subscription.user_id} -> ${plan}`);
  }
}

async function handleSubscriptionCanceled(data: any) {
  const { customer_id, customer } = data;
  const customerEmail = customer?.email;

  let subscription = null;

  if (customer_id) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("polar_customer_id", customer_id)
      .single();
    subscription = sub;
  }

  if (!subscription && customerEmail) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users.find((u) => u.email === customerEmail);
    if (user) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();
      subscription = sub;
    }
  }

  if (!subscription) return;

  await supabase
    .from("subscriptions")
    .update({
      plan: "free",
      status: "canceled",
      clips_limit: PLAN_LIMITS.free,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);

  console.log("Subscription canceled:", subscription.user_id);
}

async function handleCheckout(data: any) {
  const { customer_id, customer_email, product_id, product, status, metadata } = data;

  // Only process completed checkouts
  if (status !== "succeeded" && status !== "confirmed") {
    console.log("Checkout not completed yet:", status);
    return;
  }

  const actualProductId = product_id || product?.id;
  const userId = metadata?.user_id;

  console.log("Handling checkout:", { customer_id, customer_email, actualProductId, status, userId });

  // Find user
  let userIdToUpdate = userId;
  if (!userIdToUpdate && customer_email) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users.find((u) => u.email === customer_email);
    userIdToUpdate = user?.id;
  }

  if (!userIdToUpdate) {
    console.error("No user found for checkout:", { customer_email, userId });
    return;
  }

  const plan = productToPlan[actualProductId] || "starter";
  const clipsLimit = PLAN_LIMITS[plan];

  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userIdToUpdate,
        polar_customer_id: customer_id,
        plan,
        status: "active",
        clips_limit: clipsLimit,
        clips_used: 0,
        current_period_start: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("Failed to update subscription from checkout:", error);
  } else {
    console.log(`Checkout processed: ${customer_email} -> ${plan}`);
  }
}

async function handleOrderPaid(data: any) {
  const { customer_id, customer, product_id, product, subscription_id, metadata } = data;

  const actualProductId = product_id || product?.id;
  const customerEmail = customer?.email;
  const userId = metadata?.user_id || customer?.external_id;

  console.log("Handling order paid:", { customer_id, customerEmail, actualProductId, userId });

  // Find user
  let userIdToUpdate = userId;
  if (!userIdToUpdate && customerEmail) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users.find((u) => u.email === customerEmail);
    userIdToUpdate = user?.id;
  }

  if (!userIdToUpdate) {
    console.error("No user found for order:", { customerEmail, userId });
    return;
  }

  const plan = productToPlan[actualProductId] || "starter";
  const clipsLimit = PLAN_LIMITS[plan];

  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userIdToUpdate,
        polar_customer_id: customer_id,
        polar_subscription_id: subscription_id,
        plan,
        status: "active",
        clips_limit: clipsLimit,
        clips_used: 0,
        current_period_start: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("Failed to update subscription from order:", error);
  } else {
    console.log(`Order paid processed: ${customerEmail} -> ${plan}`);
  }
}
