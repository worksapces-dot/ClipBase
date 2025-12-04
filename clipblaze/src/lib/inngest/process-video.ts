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

    // Step 1: Get video info, download, and upload to storage (all in one step to avoid URL expiration)
    const { publicVideoUrl, videoTitle, videoDuration } = await step.run("download-and-upload-video", async () => {
      await getSupabase()
        .from("videos")
        .update({ status: "downloading", updated_at: new Date().toISOString() })
        .eq("id", videoId);

      const videoIdMatch = youtubeUrl.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/
      );
      const ytVideoId = videoIdMatch?.[1];
      if (!ytVideoId) throw new Error("Invalid YouTube URL");

      console.log("Fetching video for:", ytVideoId);
      
      // Use Apify YouTube Video Downloader (epctex) - run synchronously
      const APIFY_TOKEN = process.env.APIFY_API_TOKEN!;
      
      console.log("Starting Apify YouTube downloader with URL:", youtubeUrl);
      
      // Run actor synchronously (waits for result) - using correct input format per docs
      const runResponse = await fetch(
        `https://api.apify.com/v2/acts/epctex~youtube-video-downloader/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startUrls: [youtubeUrl],
            quality: "720",
            useFfmpeg: false,
            includeFailedVideos: false,
            proxy: {
              useApifyProxy: true,
              apifyProxyGroups: ["RESIDENTIAL"],
            },
          }),
        }
      );

      if (!runResponse.ok) {
        const errorText = await runResponse.text();
        console.log("Apify error response:", errorText);
        throw new Error(`Apify API error: ${runResponse.status} - ${errorText.substring(0, 200)}`);
      }

      const results = await runResponse.json();
      console.log("Apify results:", JSON.stringify(results).substring(0, 500));
      
      if (!results || results.length === 0) {
        throw new Error("No results from Apify - video may be unavailable or restricted");
      }

      const result = results[0];
      // Per docs: result has sourceUrl and downloadUrl
      const downloadUrl = result.downloadUrl;
      const videoTitle = "YouTube Video"; // This actor doesn't return title
      
      if (!downloadUrl) {
        console.log("Full Apify result:", JSON.stringify(result));
        throw new Error("No download URL in Apify result - video may be restricted");
      }

      console.log("Got download URL:", downloadUrl.substring(0, 100));
      console.log("Video title:", videoTitle);
      
      // Download the video
      const videoResponse = await fetch(downloadUrl);
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.status}`);
      }
      
      const videoBuffer = await videoResponse.arrayBuffer();
      console.log(`Downloaded ${videoBuffer.byteLength} bytes`);
      
      if (videoBuffer.byteLength < 10000) {
        throw new Error("Downloaded file too small - may have failed");
      }

      // Upload to Supabase Storage
      const fileName = `${videoId}/source.mp4`;
      console.log(`Uploading to storage...`);

      const { error: uploadError } = await getSupabase().storage
        .from("videos")
        .upload(fileName, videoBuffer, {
          contentType: "video/mp4",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload video: ${uploadError.message}`);
      }

      const { data: urlData } = getSupabase().storage
        .from("videos")
        .getPublicUrl(fileName);

      // Update video record with title
      await getSupabase()
        .from("videos")
        .update({ 
          title: videoTitle, 
          duration_seconds: null // Duration not always available from this API
        })
        .eq("id", videoId);

      console.log("Video uploaded successfully:", urlData.publicUrl);
      
      return {
        publicVideoUrl: urlData.publicUrl,
        videoTitle: videoTitle,
        videoDuration: null,
      };
    });

    // Step 3: Transcribe with AssemblyAI (more reliable than Whisper for various formats)
    const transcript = await step.run("transcribe-video", async () => {
      await getSupabase()
        .from("videos")
        .update({ status: "transcribing", updated_at: new Date().toISOString() })
        .eq("id", videoId);

      const { AssemblyAI } = await import("assemblyai");
      const assemblyClient = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });

      console.log("Starting AssemblyAI transcription with URL:", publicVideoUrl.substring(0, 80));

      // AssemblyAI can transcribe directly from URL - no file format issues!
      const transcriptResult = await assemblyClient.transcripts.transcribe({
        audio_url: publicVideoUrl,
        language_code: "en",
      });

      if (transcriptResult.status === "error") {
        throw new Error(`Transcription failed: ${transcriptResult.error}`);
      }

      // Convert AssemblyAI words to segments (group by sentences/pauses)
      const words = transcriptResult.words || [];
      const segments: TranscriptSegment[] = [];
      let currentSegment: { start: number; end: number; text: string } | null = null;

      for (const word of words) {
        if (!currentSegment) {
          currentSegment = {
            start: (word.start || 0) / 1000,
            end: (word.end || 0) / 1000,
            text: word.text || "",
          };
        } else {
          const gap = ((word.start || 0) - (currentSegment.end * 1000)) / 1000;
          // Start new segment if gap > 1 second or segment > 30 seconds
          if (gap > 1 || (word.end || 0) / 1000 - currentSegment.start > 30) {
            segments.push(currentSegment);
            currentSegment = {
              start: (word.start || 0) / 1000,
              end: (word.end || 0) / 1000,
              text: word.text || "",
            };
          } else {
            currentSegment.end = (word.end || 0) / 1000;
            currentSegment.text += " " + (word.text || "");
          }
        }
      }
      if (currentSegment) segments.push(currentSegment);

      const fullText = transcriptResult.text || "";
      const duration = segments.length > 0 ? segments[segments.length - 1].end : 0;
      console.log(`Transcription complete: ${segments.length} segments, ${fullText.length} chars`);

      await getSupabase().from("transcripts").insert({
        video_id: videoId,
        full_text: fullText,
        segments,
        language: "en",
      });

      return {
        fullText,
        segments,
        duration,
      };
    });


    // Step 4: Find highlights with GPT-4
    const highlights = await step.run("find-highlights", async () => {
      await getSupabase()
        .from("videos")
        .update({ status: "analyzing", updated_at: new Date().toISOString() })
        .eq("id", videoId);

      const typedTranscript = transcript as { fullText: string; segments: TranscriptSegment[]; duration: number };
      const formattedTranscript = typedTranscript.segments
        .map((s: TranscriptSegment) => `[${formatTime(s.start)} - ${formatTime(s.end)}] ${s.text}`)
        .join("\n");

      const prompt = `You are a viral content expert. Find the SINGLE BEST clip for TikTok/Reels/Shorts.
TRANSCRIPT:
${formattedTranscript}

VIDEO DURATION: ${formatTime(typedTranscript.duration)}

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
        transcript: getTranscriptForRange(typedTranscript.segments, clip.startTime, clip.endTime),
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
      const { data: ytConnection, error: ytError } = await getSupabase()
        .from("youtube_connections")
        .select("*")
        .eq("user_id", userId)
        .eq("auto_upload_enabled", true)
        .single();

      if (!ytConnection) {
        console.log("YouTube auto-upload not enabled for user:", ytError?.message || "no connection");
        return { skipped: true, reason: "no_connection" };
      }

      // Get clips that were just created
      const { data: clips } = await getSupabase()
        .from("clips")
        .select("*")
        .eq("video_id", videoId)
        .eq("status", "completed");

      if (!clips?.length) {
        console.log("No completed clips to upload");
        return { skipped: true, reason: "no_clips" };
      }

      const results = [];
      for (const clip of clips) {
        if (!clip.storage_path) {
          console.log(`Clip ${clip.id} has no storage_path, skipping`);
          continue;
        }

        try {
          console.log(`Uploading clip to YouTube: ${clip.title}`);
          console.log(`Clip storage_path: ${clip.storage_path}`);
          
          // Update status to uploading
          await getSupabase()
            .from("clips")
            .update({ youtube_upload_status: "uploading" })
            .eq("id", clip.id);

          // Upload to YouTube
          const { uploadToYouTube, refreshAccessToken } = await import("../youtube");
          
          // Always refresh token before upload (tokens expire in 1 hour)
          console.log("Refreshing YouTube access token...");
          let accessToken = ytConnection.access_token;
          try {
            const newTokens = await refreshAccessToken(ytConnection.refresh_token);
            accessToken = newTokens.access_token!;
            console.log("Token refreshed successfully");
            
            // Update tokens in database
            await getSupabase()
              .from("youtube_connections")
              .update({
                access_token: accessToken,
                token_expires_at: newTokens.expiry_date ? new Date(newTokens.expiry_date).toISOString() : null,
              })
              .eq("id", ytConnection.id);
          } catch (refreshError) {
            console.error("Token refresh failed, using existing token:", refreshError);
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
          results.push({ clipId: clip.id, success: true, videoId: result.videoId });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Failed to upload clip to YouTube:`, errorMessage);
          console.error("Full error:", error);
          await getSupabase()
            .from("clips")
            .update({ youtube_upload_status: "failed" })
            .eq("id", clip.id);
          results.push({ clipId: clip.id, success: false, error: errorMessage });
        }
      }
      return { uploaded: results.filter(r => r.success).length, results };
    });

    // Step 7: Auto-upload to Instagram if enabled
    await step.run("instagram-upload", async () => {
      // Check if user has Instagram connected with auto-upload enabled
      const { data: igConnection } = await getSupabase()
        .from("instagram_connections")
        .select("*")
        .eq("user_id", userId)
        .eq("auto_upload_enabled", true)
        .single();

      if (!igConnection) {
        console.log("Instagram auto-upload not enabled for user");
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
          console.log(`Uploading clip to Instagram: ${clip.title}`);
          
          // Update status to uploading
          await getSupabase()
            .from("clips")
            .update({ instagram_upload_status: "uploading" })
            .eq("id", clip.id);

          // Upload to Instagram
          const { uploadToInstagram, refreshAccessToken } = await import("../instagram");
          
          // Refresh token if needed (Instagram tokens last 60 days)
          let accessToken = igConnection.access_token;
          if (igConnection.token_expires_at && new Date(igConnection.token_expires_at) < new Date()) {
            const newTokens = await refreshAccessToken(igConnection.access_token);
            accessToken = newTokens.accessToken;
            
            // Update tokens in database
            await getSupabase()
              .from("instagram_connections")
              .update({
                access_token: accessToken,
                token_expires_at: new Date(Date.now() + newTokens.expiresIn * 1000).toISOString(),
              })
              .eq("id", igConnection.id);
          }

          const result = await uploadToInstagram(
            igConnection.ig_account_id,
            accessToken,
            clip.storage_path,
            clip.title || "Viral Clip"
          );

          // Update clip with Instagram media ID
          await getSupabase()
            .from("clips")
            .update({
              instagram_media_id: result.mediaId,
              instagram_upload_status: "uploaded",
            })
            .eq("id", clip.id);

          console.log(`Clip uploaded to Instagram: ${result.permalink}`);
        } catch (error) {
          console.error(`Failed to upload clip to Instagram:`, error);
          await getSupabase()
            .from("clips")
            .update({ instagram_upload_status: "failed" })
            .eq("id", clip.id);
        }
      }
    });

    // Step 8: Complete
    await step.run("complete", async () => {
      await getSupabase()
        .from("videos")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", videoId);
    });

    return { success: true, videoId, clipsCreated: highlights.length };
  }
);
