import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export type VideoStatus = 
  | "pending" 
  | "downloading" 
  | "transcribing" 
  | "analyzing" 
  | "generating" 
  | "completed" 
  | "failed";

export interface Video {
  id: string;
  user_id: string;
  title: string | null;
  source_url: string | null;
  source_type: string | null;
  storage_path: string | null;
  duration_seconds: number | null;
  status: VideoStatus;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Fetch pending videos
export async function getPendingVideos(): Promise<Video[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(5);

  if (error) {
    console.error("Error fetching videos:", error);
    return [];
  }

  return data || [];
}

// Update video status
export async function updateVideoStatus(
  videoId: string,
  status: VideoStatus,
  extra?: { error_message?: string; storage_path?: string; title?: string; duration_seconds?: number }
): Promise<void> {
  const { error } = await supabase
    .from("videos")
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...extra,
    })
    .eq("id", videoId);

  if (error) {
    console.error("Error updating video:", error);
  }
}
