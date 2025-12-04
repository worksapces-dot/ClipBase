import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { POLAR_PRODUCTS, PLAN_LIMITS } from "@/lib/polar";

const POLAR_API_URL = "https://sandbox-api.polar.sh/v1";

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

    // Check if user has existing Polar subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?upgraded=true`;

    // If user has active Polar subscription, update it instead of creating new checkout
    if (subscription?.polar_subscription_id && subscription.plan !== "free") {
      console.log("Updating existing subscription:", subscription.polar_subscription_id);

      const updateRes = await fetch(
        `${POLAR_API_URL}/subscriptions/${subscription.polar_subscription_id}`,
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
          { error: "Failed to update subscription" },
          { status: 500 }
        );
      }

      // Update local subscription immediately
      const newPlan = plan as keyof typeof PLAN_LIMITS;
      await supabase
        .from("subscriptions")
        .update({
          plan: newPlan,
          clips_limit: PLAN_LIMITS[newPlan],
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      // Redirect to success page directly
      return NextResponse.json({ url: successUrl });
    }

    // Create new checkout for users without active subscription
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
        metadata: {
          user_id: user.id,
        },
      }),
    });

    const responseText = await checkoutRes.text();
    console.log("Polar checkout response:", checkoutRes.status, responseText);

    if (!checkoutRes.ok) {
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
        .update({ polar_customer_id: checkout.customer_id })
        .eq("user_id", user.id);
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
