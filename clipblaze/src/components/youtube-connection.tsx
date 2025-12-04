"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { YoutubeIcon } from "./icons";

interface YouTubeStatus {
  connected: boolean;
  channelTitle?: string;
  autoUploadEnabled?: boolean;
}

export function YouTubeConnection() {
  const [status, setStatus] = useState<YouTubeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/youtube/status")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleConnect = () => {
    window.location.href = "/api/auth/youtube";
  };

  const toggleAutoUpload = async () => {
    if (!status) return;

    const newValue = !status.autoUploadEnabled;
    setStatus({ ...status, autoUploadEnabled: newValue });

    await fetch("/api/youtube/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoUploadEnabled: newValue }),
    });
  };

  if (loading) {
    return (
      <div className="glass-card p-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-32 mb-2" />
        <div className="h-8 bg-white/10 rounded w-24" />
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <YoutubeIcon className="w-5 h-5 text-red-500" />
        <span className="font-medium">YouTube Shorts</span>
      </div>

      {status?.connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">
              Connected to {status.channelTitle}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Auto-upload clips</span>
            <button
              onClick={toggleAutoUpload}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                status.autoUploadEnabled ? "bg-green-500" : "bg-white/20"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  status.autoUploadEnabled ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {status.autoUploadEnabled && (
            <p className="text-xs text-muted-foreground">
              New clips will be automatically uploaded to your YouTube channel as Shorts
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Connect your YouTube channel to auto-upload clips as Shorts
          </p>
          <Button
            onClick={handleConnect}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <YoutubeIcon className="w-4 h-4 mr-2" />
            Connect YouTube
          </Button>
        </div>
      )}
    </div>
  );
}
