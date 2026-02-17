export declare class Clipboard {
    private constructor();
    static copy(text: string): Promise<boolean>;
    static paste(): Promise<string | null>;
    static copyImage(blob: Blob): Promise<boolean>;
    static copyHtml(html: string, plainText?: string): Promise<boolean>;
    static isSupported(): boolean;
    static isWriteSupported(): boolean;
    private static fallbackCopy;
}
