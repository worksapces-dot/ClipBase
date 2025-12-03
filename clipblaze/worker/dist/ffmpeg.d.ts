interface Segment {
    start: number;
    end: number;
    text: string;
}
export declare function extractAudio(videoPath: string, outputPath: string): Promise<void>;
export declare function generateClip(videoPath: string, outputPath: string, startTime: number, endTime: number, segments: Segment[]): Promise<void>;
export {};
