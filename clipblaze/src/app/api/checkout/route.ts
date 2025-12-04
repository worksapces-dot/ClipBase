import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { POLAR_PRODUCTS } from "@/lib/polar";

const POLAR_API_URL = "https://sandbox-api.polar.sh/v1";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await request.json();
    const product = POLAR_PRODUCTS[plan as keyof typeof POLAR_PRODUCTS];

    if (!product) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Get or create Polar customer
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("polar_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = subscription?.polar_customer_id;

    if (!customerId) {
      // Create Polar customer
      const customerRes = await fetch(`${POLAR_API_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          email: user.email,
          name: user.user_metadata?.full_name,
          external_id: user.id,
        }),
      });

      if (!customerRes.ok) {
        const error = await customerRes.text();
        console.error("Failed to create Polar customer:", error);
        return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
      }

      const customer = await customerRes.json();
      customerId = customer.id;

      // Save customer ID
      await supabase
        .from("subscriptions")
        .update({ polar_customer_id: customerId })
        .eq("user_id", user.id);
    }

    // Create checkout session
    const checkoutRes = await fetch(`${POLAR_API_URL}/checkouts/custom`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        product_id: product.id,
        customer_id: customerId,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?upgraded=true`,
        allow_discount_codes: true,
      }),
    });

    if (!checkoutRes.ok) {
      const error = await checkoutRes.text();
      console.error("Failed to create checkout:", error);
      return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
    }

    const checkout = await checkoutRes.json();

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
