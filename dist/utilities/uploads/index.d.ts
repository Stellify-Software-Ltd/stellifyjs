/**
 * Stellify Uploads
 *
 * A driver-agnostic file upload primitive that works with stellify/file-uploads
 * server-side package. Handles chunked uploads through either:
 * - Direct-to-storage via pre-signed URLs (S3/R2/MinIO)
 * - Through-app uploads (any Laravel disk)
 *
 * The client discovers per-part which strategy to use based on server response.
 * Consumer code never needs to know which driver is active.
 *
 * @example
 * const uploader = Uploader.create({
 *   endpoints: {
 *     initiate: '/uploads/initiate',
 *     signPart: '/uploads/sign-part',
 *     storePart: '/uploads/store-part',
 *     complete: '/uploads/complete',
 *     abort: '/uploads/abort',
 *   },
 * });
 *
 * uploader.on('progress', ({ loaded, total, percent }) => {
 *   console.log(`${percent}% complete`);
 * });
 *
 * uploader.on('complete', (result) => {
 *   console.log('Upload complete:', result);
 * });
 *
 * await uploader.upload(file);
 */
export type UploadEndpoints = {
    initiate: string;
    signPart: string;
    storePart: string;
    complete: string;
    abort: string;
};
export type UploaderOptions = {
    endpoints: UploadEndpoints;
    chunkSize?: number;
    concurrency?: number;
    retries?: number;
    retryBackoffMs?: number;
    headers?: Record<string, string>;
    credentials?: RequestCredentials;
};
export type UploadHandle = {
    id: string;
    disk: string;
    filename: string;
    total_parts: number;
    chunk_size: number;
    driver_data: Record<string, unknown>;
};
export type PartReceipt = {
    part_number: number;
    size: number;
    receipt_data: Record<string, unknown>;
};
export type SignedPartResponse = {
    signed_url: string | null;
};
export type UploadResult = {
    path: string;
    size: number;
    mime: string;
    original_name: string;
    disk: string;
};
export type ProgressEvent = {
    loaded: number;
    total: number;
    percent: number;
};
export type PartCompleteEvent = {
    partNumber: number;
    size: number;
    total: number;
    completed: number;
};
export type UploadErrorCode = 'NETWORK' | 'SIGNING_FAILED' | 'PART_UPLOAD_FAILED' | 'COMPLETE_FAILED' | 'VALIDATION' | 'ABORTED' | 'UNKNOWN';
export declare class UploadError extends Error {
    code: UploadErrorCode;
    cause?: Error;
    constructor(code: UploadErrorCode, message: string, cause?: Error);
}
type EventCallback<T = unknown> = (data: T) => void;
type UploaderEvents = {
    start: UploadHandle;
    'part-complete': PartCompleteEvent;
    progress: ProgressEvent;
    complete: UploadResult;
    abort: void;
    error: UploadError;
};
export declare class Uploader {
    private endpoints;
    private chunkSize;
    private concurrency;
    private retries;
    private retryBackoffMs;
    private headers;
    private credentials;
    private listeners;
    private handle;
    private receipts;
    private parts;
    private file;
    private aborted;
    private uploading;
    private constructor();
    /**
     * Create a new Uploader instance.
     */
    static create(options: UploaderOptions): Uploader;
    /**
     * Build headers including CSRF token from meta tag if present.
     */
    private buildHeaders;
    /**
     * Register an event listener.
     */
    on<K extends keyof UploaderEvents>(event: K, callback: EventCallback<UploaderEvents[K]>): Uploader;
    /**
     * Remove an event listener.
     */
    off<K extends keyof UploaderEvents>(event: K, callback: EventCallback<UploaderEvents[K]>): Uploader;
    /**
     * Emit an event to all listeners.
     */
    private emit;
    /**
     * Upload a file.
     * Resolves when complete, rejects on error or abort.
     */
    upload(file: File): Promise<UploadResult>;
    /**
     * Abort an in-progress upload.
     * Safe to call at any point in the lifecycle.
     */
    abort(): void;
    /**
     * Reset internal state for a new upload.
     */
    private reset;
    /**
     * Initiate the upload with the server.
     */
    private initiate;
    /**
     * Calculate part boundaries.
     */
    private calculateParts;
    /**
     * Upload all parts with concurrency control.
     */
    private uploadAllParts;
    /**
     * Upload a single part with retry logic.
     */
    private uploadPartWithRetry;
    /**
     * Upload a single part.
     * Decides between signed URL (direct) or store-part (through app).
     */
    private uploadPart;
    /**
     * Get signed URL for a part (or null for through-app).
     */
    private signPart;
    /**
     * Upload directly to storage using signed URL.
     * Does NOT include CSRF tokens or session cookies.
     */
    private uploadDirect;
    /**
     * Upload through the app (chunk-through-app driver).
     */
    private uploadThroughApp;
    /**
     * Complete the upload.
     */
    private complete;
    /**
     * Call the abort endpoint to clean up server-side resources.
     * Does not emit events - caller handles that.
     */
    private callAbortEndpoint;
    /**
     * Emit a progress event with aggregated byte counts.
     */
    private emitProgress;
    /**
     * Make a JSON request to an app endpoint.
     */
    private fetchJson;
    /**
     * Build a full URL from a relative endpoint.
     */
    private buildUrl;
    /**
     * Check if an error is permanent (should not be retried).
     */
    private isPermanentError;
    /**
     * Sleep for a given number of milliseconds.
     */
    private sleep;
    /**
     * Get the current upload progress.
     */
    getProgress(): ProgressEvent;
    /**
     * Check if an upload is currently in progress.
     */
    isUploading(): boolean;
}
export {};
