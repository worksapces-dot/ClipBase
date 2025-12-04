import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: connection } = await supabase
      .from("youtube_connections")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!connection) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      channelTitle: connection.channel_title,
      autoUploadEnabled: connection.auto_upload_enabled,
    });
  } catch (error) {
    console.error("YouTube status error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { autoUploadEnabled } = await request.json();

    await supabase
      .from("youtube_connections")
      .update({ 
        auto_upload_enabled: autoUploadEnabled,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("YouTube update error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
