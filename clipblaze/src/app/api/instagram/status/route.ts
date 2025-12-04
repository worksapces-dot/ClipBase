import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ connected: false });
    }

    const { data: connection } = await supabase
      .from("instagram_connections")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!connection) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      username: connection.username,
      profilePicture: connection.profile_picture_url,
      autoUploadEnabled: connection.auto_upload_enabled,
    });
  } catch {
    return NextResponse.json({ connected: false });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { autoUploadEnabled } = body;

    await supabase
      .from("instagram_connections")
      .update({ 
        auto_upload_enabled: autoUploadEnabled,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await supabase
      .from("instagram_connections")
      .delete()
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
