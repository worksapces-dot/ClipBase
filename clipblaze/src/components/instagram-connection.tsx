"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";

interface InstagramStatus {
  connected: boolean;
  username?: string;
  profilePicture?: string;
  autoUploadEnabled?: boolean;
}

export function InstagramConnection() {
  const [status, setStatus] = useState<InstagramStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/instagram/status")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleConnect = () => {
    window.location.href = "/api/auth/instagram";
  };

  const toggleAutoUpload = async () => {
    if (!status) return;

    const newValue = !status.autoUploadEnabled;
    setStatus({ ...status, autoUploadEnabled: newValue });

    await fetch("/api/instagram/status", {
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
        <Instagram className="w-5 h-5 text-pink-500" />
        <span className="font-medium">Instagram Reels</span>
      </div>

      {status?.connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">
              Connected to @{status.username}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Auto-upload clips</span>
            <button
              onClick={toggleAutoUpload}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                status.autoUploadEnabled ? "bg-pink-500" : "bg-white/20"
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
              New clips will be automatically uploaded to your Instagram as Reels
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Connect your Instagram Business account to auto-upload clips as Reels
          </p>
          <Button
            onClick={handleConnect}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 text-white"
          >
            <Instagram className="w-4 h-4 mr-2" />
            Connect Instagram
          </Button>
        </div>
      )}
    </div>
  );
}
