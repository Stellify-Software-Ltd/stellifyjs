type SpeechEventCallback = (text: string) => void;
type SpeechErrorCallback = (error: SpeechError) => void;
interface ListenOptions {
    continuous?: boolean;
    interimResults?: boolean;
    language?: string;
    maxAlternatives?: number;
}
interface SpeakOptions {
    voice?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
}
interface Voice {
    id: string;
    name: string;
    language: string;
    local: boolean;
}
export declare class Speech {
    private recognition;
    private synthesis;
    private currentUtterance;
    private resultCallback;
    private interimCallback;
    private endCallback;
    private errorCallback;
    private constructor();
    static create(): Speech;
    static isSupported(): {
        recognition: boolean;
        synthesis: boolean;
    };
    listen(options?: ListenOptions): this;
    stopListening(): this;
    onResult(callback: SpeechEventCallback): this;
    onInterim(callback: SpeechEventCallback): this;
    onEnd(callback: () => void): this;
    onError(callback: SpeechErrorCallback): this;
    speak(text: string, options?: SpeakOptions): this;
    stopSpeaking(): this;
    pause(): this;
    resume(): this;
    getVoices(): Voice[];
    getVoicesByLanguage(language: string): Voice[];
    isSpeaking(): boolean;
    isListening(): boolean;
}
export declare class SpeechError extends Error {
    constructor(message: string);
}
export {};
