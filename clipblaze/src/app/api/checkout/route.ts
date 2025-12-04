import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { POLAR_PRODUCTS } from "@/lib/polar";

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

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?upgraded=true`;

    // Create checkout session via Polar API v1
    const checkoutRes = await fetch(`${POLAR_API_URL}/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        product_price_id: product.priceId,
        success_url: successUrl,
        customer_email: user.email,
        customer_name: user.user_metadata?.full_name,
        metadata: {
          user_id: user.id,
        },
      }),
    });

    if (!checkoutRes.ok) {
      const error = await checkoutRes.text();
      console.error("Failed to create checkout:", error);
      return NextResponse.json(
        { error: "Failed to create checkout: " + error },
        { status: 500 }
      );
    }

    const checkout = await checkoutRes.json();

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
