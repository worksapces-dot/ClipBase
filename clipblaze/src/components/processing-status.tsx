"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type Status = 'pending' | 'downloading' | 'transcribing' | 'analyzing' | 'generating' | 'completed' | 'failed';

interface ProcessingStatusProps {
  videoId: string;
  initialStatus?: Status;
  onComplete?: () => void;
  onCancel?: () => void;
}

const steps: { status: Status; label: string; icon: string }[] = [
  { status: 'downloading', label: 'Downloading video', icon: '📥' },
  { status: 'transcribing', label: 'Transcribing audio', icon: '🎙️' },
  { status: 'analyzing', label: 'Finding highlights', icon: '🔍' },
  { status: 'generating', label: 'Creating clips', icon: '✂️' },
  { status: 'completed', label: 'Done!', icon: '✅' },
];

export function ProcessingStatus({ videoId, initialStatus = 'pending', onComplete, onCancel }: ProcessingStatusProps) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/cancel`, { method: 'POST' });
      if (res.ok) {
        setStatus('failed');
        setError('Cancelled by user');
        onCancel?.();
      }
    } catch (err) {
      console.error('Cancel error:', err);
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (status === 'completed' || status === 'failed') return;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}`);
        if (!res.ok) throw new Error('Failed to fetch status');
        
        const data = await res.json();
        setStatus(data.status);
        
        if (data.status === 'failed') {
          setError(data.error_message || 'Processing failed');
        }
        
        if (data.status === 'completed') {
          onComplete?.();
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [videoId, status, onComplete]);

  const currentStepIndex = steps.findIndex(s => s.status === status);

  if (status === 'failed') {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">❌</div>
        <h3 className="text-lg font-semibold text-red-400 mb-2">Processing Failed</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Processing your video...</h3>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {currentStepIndex + 1} / {steps.length}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={cancelling}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <X className="w-4 h-4 mr-1" />
            {cancelling ? 'Stopping...' : 'Stop'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const isActive = step.status === status;
          const isCompleted = currentStepIndex > index || status === 'completed';
          const isPending = currentStepIndex < index;

          return (
            <div
              key={step.status}
              className={cn(
                "flex items-center gap-4 p-3 rounded-lg transition-all",
                isActive && "bg-white/5",
                isCompleted && "opacity-60"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-lg",
                isActive && "bg-white/10 animate-pulse",
                isCompleted && "bg-green-500/20",
                isPending && "bg-white/5"
              )}>
                {isCompleted ? '✓' : step.icon}
              </div>
              <div className="flex-1">
                <div className={cn(
                  "font-medium",
                  isActive && "text-white",
                  !isActive && "text-white/60"
                )}>
                  {step.label}
                </div>
                {isActive && (
                  <div className="text-sm text-muted-foreground mt-1">
                    This may take a few minutes...
                  </div>
                )}
              </div>
              {isActive && (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
