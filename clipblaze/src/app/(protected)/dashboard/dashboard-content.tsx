"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { VideoInput } from "@/components/video-input";
import { ProcessingStatus } from "@/components/processing-status";
import { ClipCard } from "@/components/clip-card";
import { Video, Clip } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Confetti, ConfettiRef } from "@/components/ui/confetti";
import { YouTubeConnection } from "@/components/youtube-connection";
import { InstagramConnection } from "@/components/instagram-connection";

type VideoWithClips = Video & { clips: Clip[] };

interface Subscription {
  plan: string;
  clipsUsed: number;
  clipsLimit: number;
  canGenerate: boolean;
}

interface DashboardContentProps {
  displayName: string;
  initialVideos: VideoWithClips[];
}

export function DashboardContent({ displayName, initialVideos }: DashboardContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [videos, setVideos] = useState<VideoWithClips[]>(initialVideos);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const confettiRef = useRef<ConfettiRef>(null);

  // Find any video that's currently processing
  const processingVideo = videos.find(v => 
    v.status !== "completed" && v.status !== "failed"
  );

  // Fetch subscription info
  useEffect(() => {
    fetch("/api/subscription")
      .then((res) => res.json())
      .then((data) => setSubscription(data))
      .catch(console.error);
  }, []);

  // Handle URL from hero redirect
  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam) {
      handleSubmit(urlParam);
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  // Show upgrade success with confetti
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      // Delay confetti to ensure canvas is ready
      const timer = setTimeout(() => {
        // Fire multiple bursts for better effect
        confettiRef.current?.fire({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6, x: 0.5 },
        });
        setTimeout(() => {
          confettiRef.current?.fire({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
          });
        }, 200);
        setTimeout(() => {
          confettiRef.current?.fire({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
          });
        }, 400);
      }, 300);

      // Refresh subscription
      fetch("/api/subscription")
        .then((res) => res.json())
        .then((data) => setSubscription(data));
      router.replace("/dashboard");

      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  const handleSubmit = async (url: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/videos/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process video");
      }

      // Add new video to list
      setVideos(prev => [{
        id: data.videoId,
        user_id: "",
        title: "Processing...",
        source_url: url,
        source_type: "youtube",
        storage_path: null,
        duration_seconds: null,
        status: "pending",
        error_message: null,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        clips: [],
      }, ...prev]);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleProcessingComplete = async () => {
    // Refresh all videos
    const res = await fetch("/api/videos");
    if (res.ok) {
      const data = await res.json();
      setVideos(Array.isArray(data) ? data : data.videos || []);
    }
  };

  const completedVideos = videos.filter(v => v.status === "completed");
  const allClips = completedVideos.flatMap(v => v.clips || []);

  const usagePercent = subscription
    ? subscription.clipsLimit === -1
      ? 0
      : (subscription.clipsUsed / subscription.clipsLimit) * 100
    : 0;

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      {/* Confetti for upgrade celebration */}
      <Confetti
        ref={confettiRef}
        className="fixed left-0 top-0 w-full h-full pointer-events-none z-50"
        style={{ width: "100vw", height: "100vh" }}
        manualstart
      />

      {/* Header with Usage */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {displayName}!
          </h1>
          <p className="text-muted-foreground">
            Paste a YouTube link to generate viral clips automatically.
          </p>
        </div>

        {/* Usage Card */}
        {subscription && (
          <div className="glass-card p-4 min-w-[200px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan
              </span>
              <Link href="/pricing">
                <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                  {subscription.plan === "free" ? "Upgrade" : "Manage"}
                </Button>
              </Link>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl font-bold">{subscription.clipsUsed}</span>
              <span className="text-muted-foreground">
                / {subscription.clipsLimit === -1 ? "∞" : subscription.clipsLimit} clips
              </span>
            </div>
            {subscription.clipsLimit !== -1 && (
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Social Connections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <YouTubeConnection />
        <InstagramConnection />
      </div>

      {/* Usage Limit Warning */}
      {subscription && !subscription.canGenerate && (
        <div className="glass-card p-4 mb-8 border border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-yellow-400">You've reached your clip limit</p>
              <p className="text-sm text-muted-foreground">
                Upgrade your plan to generate more clips this month.
              </p>
            </div>
            <Link href="/pricing">
              <Button className="bg-white text-black hover:bg-white/90">
                Upgrade Now
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Video Input */}
      <div className="mb-8">
        <VideoInput 
          onSubmit={handleSubmit} 
          isLoading={isSubmitting || !!processingVideo}
          disabled={subscription ? !subscription.canGenerate : false}
        />
        {error && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}
        <p className="text-sm text-muted-foreground mt-3">
          Supports YouTube videos up to 60 minutes
        </p>
      </div>

      {/* Processing Status */}
      {processingVideo && (
        <div className="mb-12">
          <ProcessingStatus 
            videoId={processingVideo.id}
            initialStatus={processingVideo.status as "pending" | "downloading" | "transcribing" | "analyzing" | "generating" | "completed" | "failed"}
            onComplete={handleProcessingComplete}
          />
        </div>
      )}

      {/* Generated Clips */}
      {allClips.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Your Clips</h2>
            <span className="text-sm text-muted-foreground">
              {allClips.length} clip{allClips.length !== 1 ? "s" : ""}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allClips.map((clip) => (
              <ClipCard key={clip.id} clip={clip} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {allClips.length === 0 && !processingVideo && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No clips yet</h3>
          <p className="text-muted-foreground text-sm">
            Paste a YouTube link above to generate your first viral clips
          </p>
        </div>
      )}
    </main>
  );
}
