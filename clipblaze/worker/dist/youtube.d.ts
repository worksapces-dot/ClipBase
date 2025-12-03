export interface VideoInfo {
    id: string;
    title: string;
    duration: number;
    thumbnail: string;
    channel: string;
}
export declare function getVideoInfo(url: string): Promise<VideoInfo>;
export declare function downloadVideo(url: string, outputPath: string): Promise<void>;
