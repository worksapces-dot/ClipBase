import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getTokensFromCode, getChannelInfo } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${baseUrl}/dashboard?youtube_error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/dashboard?youtube_error=no_code`);
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${baseUrl}/login`);
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(`${baseUrl}/dashboard?youtube_error=no_tokens`);
    }

    // Get channel info
    const channel = await getChannelInfo(tokens.access_token);

    if (!channel) {
      return NextResponse.redirect(`${baseUrl}/dashboard?youtube_error=no_channel`);
    }

    // Save to database
    await supabase.from("youtube_connections").upsert({
      user_id: user.id,
      channel_id: channel.id,
      channel_title: channel.title,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      auto_upload_enabled: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return NextResponse.redirect(`${baseUrl}/dashboard?youtube_connected=true`);
  } catch (error) {
    console.error("YouTube OAuth error:", error);
    return NextResponse.redirect(`${baseUrl}/dashboard?youtube_error=auth_failed`);
  }
}
