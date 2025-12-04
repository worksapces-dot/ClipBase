import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { POLAR_PRODUCTS, PLAN_LIMITS } from "@/lib/polar";

const POLAR_API_URL = "https://sandbox-api.polar.sh/v1";

// Map Polar product IDs to plan names
const productToPlan: Record<string, keyof typeof PLAN_LIMITS> = {
  [POLAR_PRODUCTS.starter.id]: "starter",
  [POLAR_PRODUCTS.pro.id]: "pro",
  [POLAR_PRODUCTS.unlimited.id]: "unlimited",
};

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get local subscription
    const { data: localSub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Search for customer in Polar by email
    const customerRes = await fetch(
      `${POLAR_API_URL}/customers/?query=${encodeURIComponent(user.email || "")}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        },
      }
    );

    if (!customerRes.ok) {
      console.error("Failed to fetch Polar customers");
      return NextResponse.json({ error: "Failed to fetch from Polar" }, { status: 500 });
    }

    const customers = await customerRes.json();
    const polarCustomer = customers.items?.find(
      (c: any) => c.email === user.email || c.external_id === user.id
    );

    if (!polarCustomer) {
      console.log("No Polar customer found for:", user.email);
      return NextResponse.json({ 
        synced: false, 
        message: "No Polar customer found",
        plan: localSub?.plan || "free"
      });
    }

    // Get active subscriptions for this customer
    const subsRes = await fetch(
      `${POLAR_API_URL}/subscriptions/?customer_id=${polarCustomer.id}&active=true`,
      {
        headers: {
          Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        },
      }
    );

    if (!subsRes.ok) {
      console.error("Failed to fetch Polar subscriptions");
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
    }

    const subscriptions = await subsRes.json();
    const activeSub = subscriptions.items?.[0];

    if (!activeSub) {
      console.log("No active Polar subscription found");
      // Reset to free if no active subscription
      if (localSub && localSub.plan !== "free") {
        await supabase
          .from("subscriptions")
          .update({
            plan: "free",
            status: "canceled",
            clips_limit: PLAN_LIMITS.free,
            polar_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      }
      return NextResponse.json({ 
        synced: true, 
        message: "No active subscription - reset to free",
        plan: "free"
      });
    }

    // Map product to plan
    const productId = activeSub.product_id || activeSub.product?.id;
    const plan = productToPlan[productId] || "starter";
    const clipsLimit = PLAN_LIMITS[plan];

    // Update local subscription
    const updateData = {
      user_id: user.id,
      polar_customer_id: polarCustomer.id,
      polar_subscription_id: activeSub.id,
      plan,
      status: "active",
      clips_limit: clipsLimit,
      current_period_start: activeSub.current_period_start,
      current_period_end: activeSub.current_period_end,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("subscriptions")
      .upsert(updateData, { onConflict: "user_id" });

    if (error) {
      console.error("Failed to update local subscription:", error);
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
    }

    console.log(`Synced subscription: ${user.email} -> ${plan}`);

    return NextResponse.json({
      synced: true,
      plan,
      clipsLimit,
      polarSubscriptionId: activeSub.id,
      currentPeriodEnd: activeSub.current_period_end,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
