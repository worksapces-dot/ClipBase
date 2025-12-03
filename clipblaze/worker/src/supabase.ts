import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface Job {
  id: string;
  user_id: string;
  youtube_url: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  error_message?: string;
  output_url?: string;
}

// Fetch pending jobs
export async function getPendingJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(5);

  if (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }

  return data || [];
}

// Update job status
export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  extra?: { error_message?: string; output_url?: string }
): Promise<void> {
  const { error } = await supabase
    .from("jobs")
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...extra,
    })
    .eq("id", jobId);

  if (error) {
    console.error("Error updating job:", error);
  }
}
