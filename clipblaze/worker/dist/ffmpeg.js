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
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAudio = extractAudio;
exports.generateClip = generateClip;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function extractAudio(videoPath, outputPath) {
    const command = `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -ar 16000 -ac 1 -y "${outputPath}"`;
    await execAsync(command, { timeout: 5 * 60 * 1000 });
}
async function generateClip(videoPath, outputPath, startTime, endTime, segments) {
    const duration = endTime - startTime;
    const workDir = path.dirname(outputPath);
    const subtitlePath = path.join(workDir, `subs_${Date.now()}.ass`);
    // Generate ASS subtitles
    const assContent = generateASSSubtitles(segments, startTime);
    fs.writeFileSync(subtitlePath, assContent);
    // FFmpeg command:
    // 1. Trim video
    // 2. Crop to 9:16 (vertical) with center focus
    // 3. Scale to 1080x1920
    // 4. Burn in subtitles
    // 5. Re-encode with good quality
    const command = `ffmpeg -ss ${startTime} -i "${videoPath}" -t ${duration} -vf "crop=ih*9/16:ih,scale=1080:1920,ass=${subtitlePath}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -y "${outputPath}"`;
    try {
        await execAsync(command, { timeout: 5 * 60 * 1000 });
    }
    finally {
        // Cleanup subtitle file
        try {
            fs.unlinkSync(subtitlePath);
        }
        catch { }
    }
}
function generateASSSubtitles(segments, startOffset) {
    let ass = `[Script Info]
Title: ClipBlaze Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial Black,60,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,2,2,40,40,180,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
    for (const seg of segments) {
        const start = seg.start - startOffset;
        const end = seg.end - startOffset;
        if (start < 0)
            continue;
        const startStr = formatASSTime(start);
        const endStr = formatASSTime(end);
        // Clean and format text - uppercase for impact
        const text = seg.text
            .trim()
            .toUpperCase()
            .replace(/\n/g, "\\N")
            .replace(/,/g, "\\N"); // Break on commas for readability
        ass += `Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,${text}\n`;
    }
    return ass;
}
function formatASSTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}
