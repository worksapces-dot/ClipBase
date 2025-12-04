import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { POLAR_PRODUCTS, PLAN_LIMITS } from "@/lib/polar";

const POLAR_API_URL = "https://sandbox-api.polar.sh/v1";

// Map Polar product IDs to plan names
const productToPlan: Record<string, keyof typeof PLAN_LIMITS> = {
  [POLAR_PRODUCTS.starter.id]: "starter",
  [POLAR_PRODUCTS.pro.id]: "pro",
  [POLAR_PRODUCTS.unlimited.id]: "unlimited",
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await request.json();
    const product = POLAR_PRODUCTS[plan as keyof typeof POLAR_PRODUCTS];

    if (!product) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?upgraded=true`;

    // Check if user has existing Polar subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // First, check Polar directly for any existing subscription by email
    const customerRes = await fetch(
      `${POLAR_API_URL}/customers/?query=${encodeURIComponent(user.email || "")}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        },
      }
    );

    let polarCustomer = null;
    let activePolarSub = null;

    if (customerRes.ok) {
      const customers = await customerRes.json();
      polarCustomer = customers.items?.find(
        (c: any) => c.email === user.email || c.external_id === user.id
      );

      if (polarCustomer) {
        // Check for active subscriptions
        const subsRes = await fetch(
          `${POLAR_API_URL}/subscriptions/?customer_id=${polarCustomer.id}&active=true`,
          {
            headers: {
              Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
            },
          }
        );

        if (subsRes.ok) {
          const subs = await subsRes.json();
          activePolarSub = subs.items?.[0];
        }
      }
    }

    // If user has active Polar subscription, update it
    if (activePolarSub) {
      const currentProductId = activePolarSub.product_id || activePolarSub.product?.id;
      const currentPlan = productToPlan[currentProductId];

      // If already on the same plan, just sync and redirect
      if (currentProductId === product.id) {
        // Sync local DB
        await supabase
          .from("subscriptions")
          .upsert({
            user_id: user.id,
            polar_customer_id: polarCustomer.id,
            polar_subscription_id: activePolarSub.id,
            plan: currentPlan,
            status: "active",
            clips_limit: PLAN_LIMITS[currentPlan],
            current_period_start: activePolarSub.current_period_start,
            current_period_end: activePolarSub.current_period_end,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

        return NextResponse.json({ 
          url: successUrl,
          message: "Already on this plan" 
        });
      }

      // Update to new plan
      console.log("Updating existing subscription:", activePolarSub.id, "to", plan);

      const updateRes = await fetch(
        `${POLAR_API_URL}/subscriptions/${activePolarSub.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            product_id: product.id,
          }),
        }
      );

      const updateText = await updateRes.text();
      console.log("Polar subscription update response:", updateRes.status, updateText);

      if (!updateRes.ok) {
        console.error("Failed to update subscription:", updateText);
        return NextResponse.json(
          { error: "Failed to update subscription. Please contact support." },
          { status: 500 }
        );
      }

      // Update local subscription
      const newPlan = plan as keyof typeof PLAN_LIMITS;
      await supabase
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          polar_customer_id: polarCustomer.id,
          polar_subscription_id: activePolarSub.id,
          plan: newPlan,
          status: "active",
          clips_limit: PLAN_LIMITS[newPlan],
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      return NextResponse.json({ url: successUrl });
    }

    // No active subscription - create new checkout
    const checkoutRes = await fetch(`${POLAR_API_URL}/checkouts/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        product_price_id: product.priceId,
        success_url: successUrl,
        customer_email: user.email,
        customer_name: user.user_metadata?.full_name || user.email?.split("@")[0],
        customer_external_id: user.id,
        metadata: {
          user_id: user.id,
        },
      }),
    });

    const responseText = await checkoutRes.text();
    console.log("Polar checkout response:", checkoutRes.status, responseText);

    if (!checkoutRes.ok) {
      // Check if error is about existing subscription
      if (responseText.includes("already") || responseText.includes("subscription")) {
        return NextResponse.json(
          { error: "You already have an active subscription. Please sync your account." },
          { status: 400 }
        );
      }
      console.error("Failed to create checkout:", responseText);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    const checkout = JSON.parse(responseText);

    // Save polar customer ID if returned
    if (checkout.customer_id) {
      await supabase
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          polar_customer_id: checkout.customer_id,
          plan: subscription?.plan || "free",
          clips_limit: subscription?.clips_limit || PLAN_LIMITS.free,
          clips_used: subscription?.clips_used || 0,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
    }

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
