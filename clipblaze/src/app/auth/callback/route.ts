import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Handle OAuth callback
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if onboarding is complete
      const onboardingComplete = request.cookies.get("onboarding_complete");
      const redirectPath = onboardingComplete ? "/dashboard" : "/onboarding";
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  // Handle email verification
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // New email users go to onboarding
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // Error - redirect to login
  return NextResponse.redirect(
    new URL("/login?error=Could not authenticate", request.url)
  );
}
