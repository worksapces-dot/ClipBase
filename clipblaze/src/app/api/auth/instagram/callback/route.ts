import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getTokensFromCode, getInstagramAccount } from "@/lib/instagram";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard?error=${encodeURIComponent(error || "No code received")}`
    );
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${baseUrl}/login`);
    }

    // Exchange code for tokens
    const { accessToken, expiresIn } = await getTokensFromCode(code);

    // Get Instagram account info
    const igAccount = await getInstagramAccount(accessToken);

    if (!igAccount) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard?error=${encodeURIComponent("No Instagram Business account found. Please connect a Facebook Page with an Instagram Business account.")}`
      );
    }

    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Save to database
    await supabase.from("instagram_connections").upsert({
      user_id: user.id,
      ig_account_id: igAccount.id,
      username: igAccount.username,
      profile_picture_url: igAccount.profilePicture,
      access_token: accessToken,
      page_access_token: igAccount.pageAccessToken,
      token_expires_at: tokenExpiresAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return NextResponse.redirect(`${baseUrl}/dashboard?instagram=connected`);
  } catch (err) {
    console.error("Instagram callback error:", err);
    return NextResponse.redirect(
      `${baseUrl}/dashboard?error=${encodeURIComponent("Failed to connect Instagram")}`
    );
  }
}
