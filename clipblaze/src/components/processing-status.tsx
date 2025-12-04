"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type Status =
  | "pending"
  | "downloading"
  | "transcribing"
  | "analyzing"
  | "generating"
  | "completed"
  | "failed";

interface ProcessingStatusProps {
  videoId: string;
  initialStatus?: Status;
  onComplete?: () => void;
  onCancel?: () => void;
}

const loadingStates = [
  { status: "downloading", text: "Downloading video from YouTube", icon: "📥" },
  { status: "transcribing", text: "Transcribing audio with AI", icon: "🎙️" },
  { status: "analyzing", text: "Finding viral moments", icon: "🔍" },
  { status: "generating", text: "Creating your clips", icon: "✂️" },
  { status: "completed", text: "All done! Your clips are ready", icon: "🎉" },
];

const CheckFilled = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={cn("w-6 h-6", className)}
  >
    <path
      fillRule="evenodd"
      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
      clipRule="evenodd"
    />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={cn("w-6 h-6", className)}
  >
    <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export function ProcessingStatus({
  videoId,
  initialStatus = "pending",
  onComplete,
  onCancel,
}: ProcessingStatusProps) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const currentStepIndex = loadingStates.findIndex((s) => s.status === status);
  const isProcessing = status !== "completed" && status !== "failed";

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        setStatus("failed");
        setError("Cancelled by user");
        onCancel?.();
      }
    } catch (err) {
      console.error("Cancel error:", err);
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (status === "completed" || status === "failed") return;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}`);
        if (!res.ok) throw new Error("Failed to fetch status");

        const data = await res.json();
        setStatus(data.status);

        if (data.status === "failed") {
          setError(data.error_message || "Processing failed");
        }

        if (data.status === "completed") {
          onComplete?.();
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [videoId, status, onComplete]);

  if (status === "failed") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center"
      >
        <div className="text-5xl mb-4">❌</div>
        <h3 className="text-xl font-semibold text-red-400 mb-2">
          Processing Failed
        </h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative"
        >
          {/* Background gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent rounded-2xl" />

          <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-semibold mb-1">
                  Creating your viral clips
                </h3>
                <p className="text-sm text-muted-foreground">
                  Step {Math.max(currentStepIndex + 1, 1)} of{" "}
                  {loadingStates.length}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={cancelling}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <X className="w-4 h-4 mr-1" />
                {cancelling ? "Stopping..." : "Cancel"}
              </Button>
            </div>

            {/* Steps */}
            <div className="relative">
              {loadingStates.map((state, index) => {
                const isActive = state.status === status;
                const isCompleted = currentStepIndex > index;
                const isPending = currentStepIndex < index;
                const distance = Math.abs(index - currentStepIndex);
                const opacity = Math.max(1 - distance * 0.15, 0.3);

                return (
                  <motion.div
                    key={state.status}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: opacity,
                      x: 0,
                      y: isActive ? 0 : 0,
                    }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={cn(
                      "flex items-center gap-4 py-4 px-4 rounded-xl mb-2 transition-all duration-300",
                      isActive && "bg-emerald-500/10 border border-emerald-500/20",
                      isCompleted && !isActive && "opacity-60"
                    )}
                  >
                    {/* Icon */}
                    <div className="relative">
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500 }}
                        >
                          <CheckFilled className="text-emerald-500 w-7 h-7" />
                        </motion.div>
                      ) : isActive ? (
                        <div className="relative">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-7 h-7 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full"
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-lg">
                            {state.icon}
                          </span>
                        </div>
                      ) : (
                        <CheckIcon className="text-white/30 w-7 h-7" />
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                      <span
                        className={cn(
                          "font-medium transition-colors",
                          isActive && "text-emerald-400",
                          isCompleted && "text-white/70",
                          isPending && "text-white/40"
                        )}
                      >
                        {state.text}
                      </span>
                      {isActive && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="text-xs text-muted-foreground mt-1"
                        >
                          This may take a few minutes...
                        </motion.p>
                      )}
                    </div>

                    {/* Status indicator */}
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${((currentStepIndex + 1) / loadingStates.length) * 100}%`,
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
