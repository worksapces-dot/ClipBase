import { inngest } from "../inngest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { PLAN_LIMITS, PlanType } from "../polar";

// Lazy-load clients to avoid build-time errors
let supabase: SupabaseClient;
let openai: OpenAI;

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// Types
interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

// Helpers
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getTranscriptForRange(segments: TranscriptSegment[], start: number, end: number): string {
  return segments.filter((s) => s.start >= start && s.end <= end).map((s) => s.text).join(" ");
}

// Creatomate API helper
async function renderClipWithCreatomate(
  videoUrl: string,
  startTime: number,
  endTime: number
): Promise<string> {
  const CREATOMATE_API_KEY = process.env.CREATOMATE_API_KEY!;
  const duration = endTime - startTime;

  console.log("Creatomate render request:", { videoUrl: videoUrl.substring(0, 100), startTime, endTime, duration });

  // Create render job - 9:16 vertical format for shorts
  const renderResponse = await fetch("https://api.creatomate.com/v2/renders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CREATOMATE_API_KEY}`,
    },
    body: JSON.stringify({
      output_format: "mp4",
      width: 1080,
      height: 1920,
      elements: [
        {
          type: "video",
          track: 1,
          source: videoUrl,
          trim_start: startTime,
          trim_duration: duration,
        },
      ],
    }),
  });

  const renderData = await renderResponse.json();
  console.log("Creatomate render response:", JSON.stringify(renderData));

  // API returns array or single object depending on request
  const render = Array.isArray(renderData) ? renderData[0] : renderData;
  
  if (!renderResponse.ok || !render?.id) {
    throw new Error(render?.message || render?.error || JSON.stringify(renderData));
  }

  const renderId = render.id;
  console.log("Creatomate render ID:", renderId);

  // Poll for completion (max 5 minutes)
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));

    const statusResponse = await fetch(`https://api.creatomate.com/v2/renders/${renderId}`, {
      headers: { "Authorization": `Bearer ${CREATOMATE_API_KEY}` },
    });
    const statusData = await statusResponse.json();
    const status = statusData.status;
    console.log(`Creatomate status (${i + 1}/60):`, status);

    if (status === "succeeded") {
      return statusData.url;
    } else if (status === "failed") {
      console.log("Creatomate failed details:", JSON.stringify(statusData));
      throw new Error("Creatomate render failed: " + (statusData.error_message || "unknown"));
    }
  }

  throw new Error("Creatomate render timeout");
}


export const processVideo = inngest.createFunction(
  { id: "process-video", retries: 3 },
  { event: "video/process" },
  async ({ event, step }) => {
    const { videoId, youtubeUrl, userId } = event.data;

    // Step 0: Check usage limits
    const usageCheck = await step.run("check-usage-limit", async () => {
      const { data: subscription } = await getSupabase()
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!subscription) {
        // Create default free subscription
        await getSupabase().from("subscriptions").insert({
          user_id: userId,
          plan: "free",
          clips_limit: PLAN_LIMITS.free,
          clips_used: 0,
        });
        return { canGenerate: true, plan: "free", used: 0, limit: PLAN_LIMITS.free };
      }

      const plan = subscription.plan as PlanType;
      const limit = subscription.clips_limit;
      const used = subscription.clips_used;

      // Unlimited plan
      if (limit === -1) {
        return { canGenerate: true, plan, used, limit: -1 };
      }

      return { canGenerate: used < limit, plan, used, limit };
    });

    if (!usageCheck.canGenerate) {
      await getSupabase()
        .from("videos")
        .update({
          status: "failed",
          error_message: `Usage limit reached (${usageCheck.used}/${usageCheck.limit} clips). Please upgrade your plan.`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", videoId);
      return { success: false, error: "Usage limit reached" };
    }

    // Step 1: Get video info and download URL
    const videoInfo = await step.run("get-video-info", async () => {
      await getSupabase()
        .from("videos")
        .update({ status: "downloading", updated_at: new Date().toISOString() })
        .eq("id", videoId);

      const videoIdMatch = youtubeUrl.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/
      );
      const ytVideoId = videoIdMatch?.[1];
      if (!ytVideoId) throw new Error("Invalid YouTube URL");

      const response = await fetch(
        `https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${ytVideoId}`,
        {
          headers: {
            "X-RapidAPI-Key": process.env.RAPIDAPI_KEY!,
            "X-RapidAPI-Host": "ytstream-download-youtube-videos.p.rapidapi.com",
          },
        }
      );

      const data = await response.json();
      if (!data.formats?.length) throw new Error("No download formats available");

      const audioFormat = data.formats.find((f: { mimeType?: string }) => f.mimeType?.includes("audio/"));
      const videoFormat = data.formats.find(
        (f: { mimeType?: string; qualityLabel?: string }) =>
          f.mimeType?.includes("video/mp4") && (f.qualityLabel === "720p" || f.qualityLabel === "480p")
      ) || data.formats.find((f: { mimeType?: string }) => f.mimeType?.includes("video/mp4"));

      return {
        title: data.title || "Untitled",
        duration: data.lengthSeconds ? parseInt(data.lengthSeconds) : null,
        audioUrl: audioFormat?.url || videoFormat?.url,
        videoUrl: videoFormat?.url,
      };
    });

    if (!videoInfo.audioUrl || !videoInfo.videoUrl) {
      await getSupabase()
        .from("videos")
        .update({ status: "failed", error_message: "Could not get download URL" })
        .eq("id", videoId);
      return { success: false, error: "Download failed" };
    }

    await getSupabase()
      .from("videos")
      .update({ title: videoInfo.title, duration_seconds: videoInfo.duration })
      .eq("id", videoId);

    // Step 2: Upload video to Supabase Storage (so Creatomate can access it)
    const publicVideoUrl = await step.run("upload-video", async () => {
      console.log("Downloading video to upload to storage...");
      const videoResponse = await fetch(videoInfo.videoUrl);
      const videoBuffer = await videoResponse.arrayBuffer();
      
      const fileName = `${videoId}/source.mp4`;
      console.log(`Uploading ${videoBuffer.byteLength} bytes to storage...`);
      
      const { error: uploadError } = await getSupabase().storage
        .from("videos")
        .upload(fileName, videoBuffer, {
          contentType: "video/mp4",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Failed to upload video: ${uploadError.message}`);
      }

      const { data: urlData } = getSupabase().storage
        .from("videos")
        .getPublicUrl(fileName);

      console.log("Video uploaded, public URL:", urlData.publicUrl);
      return urlData.publicUrl;
    });

    // Step 3: Transcribe with Whisper (use original URL since it works for direct fetch)
    const transcript = await step.run("transcribe-video", async () => {
      await getSupabase()
        .from("videos")
        .update({ status: "transcribing", updated_at: new Date().toISOString() })
        .eq("id", videoId);

      const audioResponse = await fetch(videoInfo.audioUrl);
      const audioBuffer = await audioResponse.arrayBuffer();
      const audioFile = new File([audioBuffer], "audio.mp3", { type: "audio/mpeg" });

      const response = await getOpenAI().audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["segment"],
      });

      const segments: TranscriptSegment[] = (response.segments || []).map((seg) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text.trim(),
      }));

      await getSupabase().from("transcripts").insert({
        video_id: videoId,
        full_text: response.text,
        segments,
        language: "en",
      });

      return {
        fullText: response.text,
        segments,
        duration: response.duration || segments[segments.length - 1]?.end || 0,
      };
    });


    // Step 4: Find highlights with GPT-4
    const highlights = await step.run("find-highlights", async () => {
      await getSupabase()
        .from("videos")
        .update({ status: "analyzing", updated_at: new Date().toISOString() })
        .eq("id", videoId);

      const formattedTranscript = transcript.segments
        .map((s) => `[${formatTime(s.start)} - ${formatTime(s.end)}] ${s.text}`)
        .join("\n");

      const prompt = `You are a viral content expert. Find the SINGLE BEST clip for TikTok/Reels/Shorts.

TRANSCRIPT:
${formattedTranscript}

VIDEO DURATION: ${formatTime(transcript.duration)}

Return ONLY JSON array with exactly 1 clip:
[{"title": "Catchy Title", "startTime": 0, "endTime": 30, "viralScore": 85, "reason": "Why viral"}]

Rules: title max 50 chars, clip 15-60 seconds, pick the most engaging hook/insight/emotion.`;

      const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || "[]";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const clips = JSON.parse(jsonMatch?.[0] || "[]");

      return clips.map((clip: { title: string; startTime: number; endTime: number; viralScore: number; reason: string }) => ({
        ...clip,
        transcript: getTranscriptForRange(transcript.segments, clip.startTime, clip.endTime),
      }));
    });

    if (highlights.length === 0) {
      await getSupabase()
        .from("videos")
        .update({ status: "failed", error_message: "No viral moments found" })
        .eq("id", videoId);
      return { success: false, error: "No highlights found" };
    }

    // Step 5: Generate clips with Creatomate (using public Supabase URL)
    await step.run("create-clips", async () => {
      await getSupabase()
        .from("videos")
        .update({ status: "generating", updated_at: new Date().toISOString() })
        .eq("id", videoId);

      for (let i = 0; i < highlights.length; i++) {
        const clip = highlights[i];
        console.log(`Creating clip ${i + 1}/${highlights.length}: ${clip.title}`);

        let clipUrl: string | null = null;
        let clipStatus = "completed";

        // Render clip with Creatomate (using public Supabase URL)
        try {
          clipUrl = await renderClipWithCreatomate(
            publicVideoUrl,
            clip.startTime,
            clip.endTime
          );
          console.log(`Clip ${i + 1} rendered: ${clipUrl}`);
        } catch (error) {
          console.error(`Failed to render clip ${i + 1}:`, error);
          clipStatus = "failed";
        }

        // Save clip to database (duration_seconds is auto-generated from start/end)
        const { error: insertError } = await getSupabase().from("clips").insert({
          video_id: videoId,
          user_id: userId,
          title: clip.title,
          start_time: clip.startTime,
          end_time: clip.endTime,
          transcript: clip.transcript,
          viral_score: clip.viralScore,
          highlights: [{ type: "ai", description: clip.reason }],
          status: clipStatus,
          storage_path: clipUrl,
        });

        if (insertError) {
          console.error(`Failed to save clip ${i + 1}:`, insertError);
        } else {
          console.log(`Clip ${i + 1} saved: ${clip.title}`);
          
          // Increment usage counter
          await getSupabase().rpc("increment_clips_used", { p_user_id: userId });
        }
      }
    });

    // Step 6: Auto-upload to YouTube if enabled
    await step.run("youtube-upload", async () => {
      // Check if user has YouTube connected with auto-upload enabled
      const { data: ytConnection } = await getSupabase()
        .from("youtube_connections")
        .select("*")
        .eq("user_id", userId)
        .eq("auto_upload_enabled", true)
        .single();

      if (!ytConnection) {
        console.log("YouTube auto-upload not enabled for user");
        return;
      }

      // Get clips that were just created
      const { data: clips } = await getSupabase()
        .from("clips")
        .select("*")
        .eq("video_id", videoId)
        .eq("status", "completed");

      if (!clips?.length) return;

      for (const clip of clips) {
        if (!clip.storage_path) continue;

        try {
          console.log(`Uploading clip to YouTube: ${clip.title}`);
          
          // Update status to uploading
          await getSupabase()
            .from("clips")
            .update({ youtube_upload_status: "uploading" })
            .eq("id", clip.id);

          // Upload to YouTube
          const { uploadToYouTube, refreshAccessToken } = await import("../youtube");
          
          // Refresh token if needed
          let accessToken = ytConnection.access_token;
          if (ytConnection.token_expires_at && new Date(ytConnection.token_expires_at) < new Date()) {
            const newTokens = await refreshAccessToken(ytConnection.refresh_token);
            accessToken = newTokens.access_token!;
            
            // Update tokens in database
            await getSupabase()
              .from("youtube_connections")
              .update({
                access_token: accessToken,
                token_expires_at: newTokens.expiry_date ? new Date(newTokens.expiry_date).toISOString() : null,
              })
              .eq("id", ytConnection.id);
          }

          const result = await uploadToYouTube(
            accessToken,
            ytConnection.refresh_token,
            clip.storage_path,
            clip.title || "Viral Clip",
            clip.transcript || "Created with ClipBlaze"
          );

          // Update clip with YouTube video ID
          await getSupabase()
            .from("clips")
            .update({
              youtube_video_id: result.videoId,
              youtube_upload_status: "uploaded",
            })
            .eq("id", clip.id);

          console.log(`Clip uploaded to YouTube: ${result.url}`);
        } catch (error) {
          console.error(`Failed to upload clip to YouTube:`, error);
          await getSupabase()
            .from("clips")
            .update({ youtube_upload_status: "failed" })
            .eq("id", clip.id);
        }
      }
    });

    // Step 7: Complete
    await step.run("complete", async () => {
      await getSupabase()
        .from("videos")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", videoId);
    });

    return { success: true, videoId, clipsCreated: highlights.length };
  }
);
