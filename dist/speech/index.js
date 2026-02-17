export class Speech {
    recognition = null;
    synthesis;
    currentUtterance = null;
    resultCallback = null;
    interimCallback = null;
    endCallback = null;
    errorCallback = null;
    constructor() {
        this.synthesis = window.speechSynthesis;
    }
    static create() {
        return new Speech();
    }
    static isSupported() {
        return {
            recognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
            synthesis: 'speechSynthesis' in window
        };
    }
    listen(options = {}) {
        const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionCtor) {
            throw new SpeechError('Speech recognition is not supported');
        }
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = options.continuous ?? false;
        recognition.interimResults = options.interimResults ?? false;
        recognition.lang = options.language ?? 'en-US';
        recognition.maxAlternatives = options.maxAlternatives ?? 1;
        recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript;
            if (result.isFinal) {
                this.resultCallback?.(transcript);
            }
            else {
                this.interimCallback?.(transcript);
            }
        };
        recognition.onend = () => {
            this.endCallback?.();
        };
        recognition.onerror = (event) => {
            this.errorCallback?.(new SpeechError(event.error));
        };
        recognition.start();
        this.recognition = recognition;
        return this;
    }
    stopListening() {
        this.recognition?.stop();
        this.recognition = null;
        return this;
    }
    onResult(callback) {
        this.resultCallback = callback;
        return this;
    }
    onInterim(callback) {
        this.interimCallback = callback;
        return this;
    }
    onEnd(callback) {
        this.endCallback = callback;
        return this;
    }
    onError(callback) {
        this.errorCallback = callback;
        return this;
    }
    speak(text, options = {}) {
        if (!this.synthesis) {
            throw new SpeechError('Speech synthesis is not supported');
        }
        this.stopSpeaking();
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        if (options.voice) {
            const voice = this.synthesis.getVoices().find(v => v.name === options.voice);
            if (voice) {
                this.currentUtterance.voice = voice;
            }
        }
        this.currentUtterance.rate = options.rate ?? 1;
        this.currentUtterance.pitch = options.pitch ?? 1;
        this.currentUtterance.volume = options.volume ?? 1;
        this.synthesis.speak(this.currentUtterance);
        return this;
    }
    stopSpeaking() {
        this.synthesis?.cancel();
        this.currentUtterance = null;
        return this;
    }
    pause() {
        this.synthesis?.pause();
        return this;
    }
    resume() {
        this.synthesis?.resume();
        return this;
    }
    getVoices() {
        return this.synthesis.getVoices().map(v => ({
            id: v.voiceURI,
            name: v.name,
            language: v.lang,
            local: v.localService
        }));
    }
    getVoicesByLanguage(language) {
        return this.getVoices().filter(v => v.language.startsWith(language));
    }
    isSpeaking() {
        return this.synthesis?.speaking ?? false;
    }
    isListening() {
        return this.recognition !== null;
    }
}
export class SpeechError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SpeechError';
    }
}
