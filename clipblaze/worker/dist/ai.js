"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeAudio = transcribeAudio;
exports.detectHighlights = detectHighlights;
const openai_1 = __importDefault(require("openai"));
const fs = __importStar(require("fs"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
async function transcribeAudio(audioPath) {
    const audioFile = fs.createReadStream(audioPath);
    const response = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["segment"],
    });
    const segments = (response.segments || []).map((seg) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
    }));
    return {
        text: response.text,
        segments,
    };
}
async function detectHighlights(transcript, segments, videoDuration) {
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };
    const prompt = `You are an expert at identifying viral short-form content from long videos.

Analyze this transcript and find 3-5 clips that would perform well on TikTok, Instagram Reels, and YouTube Shorts.

TRANSCRIPT WITH TIMESTAMPS:
${segments.map((s) => `[${formatTime(s.start)} - ${formatTime(s.end)}] ${s.text}`).join("\n")}

VIDEO DURATION: ${formatTime(videoDuration)}

For each clip, identify:
1. A catchy title (max 60 chars, attention-grabbing)
2. Start and end timestamps (clips should be 15-60 seconds)
3. The exact transcript for that segment
4. A viral score (0-100) based on engagement potential
5. The hook - what makes viewers stop scrolling in first 3 seconds
6. Why this clip would go viral

Look for:
- Strong hooks in the first 3 seconds (questions, bold statements, surprising facts)
- Emotional moments (surprise, humor, inspiration, controversy)
- Clear actionable advice or insights
- Story arcs with tension and resolution
- Quotable moments

Return a JSON object with a "clips" array:
{
  "clips": [
    {
      "title": "string",
      "start_time": number (seconds),
      "end_time": number (seconds),
      "transcript": "string",
      "viral_score": number,
      "hook": "string",
      "reason": "string"
    }
  ]
}

Only return valid JSON, no other text.`;
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
    });
    const content = response.choices[0]?.message?.content || '{"clips":[]}';
    try {
        const parsed = JSON.parse(content);
        const clips = Array.isArray(parsed) ? parsed : parsed.clips || [];
        // Validate and clean up clips
        return clips
            .filter((c) => c.start_time !== undefined &&
            c.end_time !== undefined &&
            c.end_time > c.start_time &&
            c.end_time - c.start_time >= 10 && // Min 10 seconds
            c.end_time - c.start_time <= 90 // Max 90 seconds
        )
            .slice(0, 5); // Max 5 clips
    }
    catch (error) {
        console.error("Failed to parse highlights:", content);
        return [];
    }
}
