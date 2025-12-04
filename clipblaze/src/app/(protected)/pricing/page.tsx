import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { PricingContent } from "./pricing-content";

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <PricingContent
      currentPlan={subscription?.plan || "free"}
      clipsUsed={subscription?.clips_used || 0}
      clipsLimit={subscription?.clips_limit || 3}
    />
  );
}
