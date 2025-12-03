interface Segment {
    start: number;
    end: number;
    text: string;
}
interface Highlight {
    title: string;
    start_time: number;
    end_time: number;
    transcript: string;
    viral_score: number;
    hook: string;
    reason: string;
}
export declare function transcribeAudio(audioPath: string): Promise<{
    text: string;
    segments: Segment[];
}>;
export declare function detectHighlights(transcript: string, segments: Segment[], videoDuration: number): Promise<Highlight[]>;
export {};
