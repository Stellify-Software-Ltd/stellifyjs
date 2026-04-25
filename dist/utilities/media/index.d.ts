interface ImageResizeOptions {
    width?: number;
    height?: number;
    quality?: number;
    type?: 'image/jpeg' | 'image/png' | 'image/webp';
}
export declare class Media {
    private constructor();
    static resize(file: File, options?: ImageResizeOptions): Promise<Blob>;
    static toBase64(file: File): Promise<string>;
    static toArrayBuffer(file: File): Promise<ArrayBuffer>;
    static toText(file: File): Promise<string>;
    private static loadImage;
}
export declare class MediaError extends Error {
    constructor(message: string);
}
export {};
