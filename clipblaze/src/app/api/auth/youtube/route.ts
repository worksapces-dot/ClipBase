import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAuthUrl } from "@/lib/youtube";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL));
  }

  const authUrl = getAuthUrl();
  return NextResponse.redirect(authUrl);
}
