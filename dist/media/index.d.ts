interface FileSelectOptions {
    accept?: string;
    multiple?: boolean;
}
interface CaptureOptions {
    video?: boolean | MediaTrackConstraints;
    audio?: boolean | MediaTrackConstraints;
}
interface ImageResizeOptions {
    width?: number;
    height?: number;
    quality?: number;
    type?: 'image/jpeg' | 'image/png' | 'image/webp';
}
interface FileMetadata {
    name: string;
    size: number;
    type: string;
    lastModified: number;
}
export declare class Media {
    private constructor();
    static selectFile(options?: FileSelectOptions): Promise<File | null>;
    static selectFiles(options?: FileSelectOptions): Promise<File[]>;
    static capture(type: 'photo' | 'video' | 'audio', options?: CaptureOptions): Promise<Blob | null>;
    private static capturePhoto;
    private static captureRecording;
    static getMetadata(file: File): FileMetadata;
    static resize(file: File, options?: ImageResizeOptions): Promise<Blob>;
    static toBase64(file: File): Promise<string>;
    static toArrayBuffer(file: File): Promise<ArrayBuffer>;
    static toText(file: File): Promise<string>;
    static formatSize(bytes: number): string;
    static isImage(file: File): boolean;
    static isVideo(file: File): boolean;
    static isAudio(file: File): boolean;
    private static loadImage;
}
export declare class MediaError extends Error {
    constructor(message: string);
}
export {};
