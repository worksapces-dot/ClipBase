import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { PLAN_LIMITS, PlanType } from "@/lib/polar";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!subscription) {
      // Create default free subscription
      const { data: newSub } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan: "free",
          clips_limit: PLAN_LIMITS.free,
          clips_used: 0,
        })
        .select()
        .single();

      return NextResponse.json({
        plan: "free",
        status: "active",
        clipsUsed: 0,
        clipsLimit: PLAN_LIMITS.free,
        canGenerate: true,
      });
    }

    const plan = subscription.plan as PlanType;
    const limit = subscription.clips_limit;
    const used = subscription.clips_used;

    return NextResponse.json({
      plan,
      status: subscription.status,
      clipsUsed: used,
      clipsLimit: limit,
      canGenerate: limit === -1 || used < limit,
      currentPeriodEnd: subscription.current_period_end,
    });
  } catch (error) {
    console.error("Subscription fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
