type SpeechEventCallback = (text: string) => void
type SpeechErrorCallback = (error: SpeechError) => void

interface ListenOptions {
  continuous?: boolean
  interimResults?: boolean
  language?: string
  maxAlternatives?: number
}

interface SpeakOptions {
  voice?: string
  rate?: number
  pitch?: number
  volume?: number
}

interface Voice {
  id: string
  name: string
  language: string
  local: boolean
}

interface SpeechRecognitionType {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onresult: ((event: any) => void) | null
  onend: (() => void) | null
  onerror: ((event: any) => void) | null
  start(): void
  stop(): void
}

export class Speech {
  private recognition: SpeechRecognitionType | null = null
  private synthesis: SpeechSynthesis
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private resultCallback: SpeechEventCallback | null = null
  private interimCallback: SpeechEventCallback | null = null
  private endCallback: (() => void) | null = null
  private errorCallback: SpeechErrorCallback | null = null

  private constructor() {
    this.synthesis = window.speechSynthesis
  }

  static create(): Speech {
    return new Speech()
  }

  static isSupported(): { recognition: boolean; synthesis: boolean } {
    return {
      recognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
      synthesis: 'speechSynthesis' in window
    }
  }

  listen(options: ListenOptions = {}): this {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognitionCtor) {
      throw new SpeechError('Speech recognition is not supported')
    }

    const recognition: SpeechRecognitionType = new SpeechRecognitionCtor()
    recognition.continuous = options.continuous ?? false
    recognition.interimResults = options.interimResults ?? false
    recognition.lang = options.language ?? 'en-US'
    recognition.maxAlternatives = options.maxAlternatives ?? 1

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      const transcript = result[0].transcript

      if (result.isFinal) {
        this.resultCallback?.(transcript)
      } else {
        this.interimCallback?.(transcript)
      }
    }

    recognition.onend = () => {
      this.endCallback?.()
    }

    recognition.onerror = (event: any) => {
      this.errorCallback?.(new SpeechError(event.error))
    }

    recognition.start()
    this.recognition = recognition
    return this
  }

  stopListening(): this {
    this.recognition?.stop()
    this.recognition = null
    return this
  }

  onResult(callback: SpeechEventCallback): this {
    this.resultCallback = callback
    return this
  }

  onInterim(callback: SpeechEventCallback): this {
    this.interimCallback = callback
    return this
  }

  onEnd(callback: () => void): this {
    this.endCallback = callback
    return this
  }

  onError(callback: SpeechErrorCallback): this {
    this.errorCallback = callback
    return this
  }

  speak(text: string, options: SpeakOptions = {}): this {
    if (!this.synthesis) {
      throw new SpeechError('Speech synthesis is not supported')
    }

    this.stopSpeaking()

    this.currentUtterance = new SpeechSynthesisUtterance(text)

    if (options.voice) {
      const voice = this.synthesis.getVoices().find(v => v.name === options.voice)
      if (voice) {
        this.currentUtterance.voice = voice
      }
    }

    this.currentUtterance.rate = options.rate ?? 1
    this.currentUtterance.pitch = options.pitch ?? 1
    this.currentUtterance.volume = options.volume ?? 1

    this.synthesis.speak(this.currentUtterance)
    return this
  }

  stopSpeaking(): this {
    this.synthesis?.cancel()
    this.currentUtterance = null
    return this
  }

  pause(): this {
    this.synthesis?.pause()
    return this
  }

  resume(): this {
    this.synthesis?.resume()
    return this
  }

  getVoices(): Voice[] {
    return this.synthesis.getVoices().map(v => ({
      id: v.voiceURI,
      name: v.name,
      language: v.lang,
      local: v.localService
    }))
  }

  getVoicesByLanguage(language: string): Voice[] {
    return this.getVoices().filter(v => v.language.startsWith(language))
  }

  isSpeaking(): boolean {
    return this.synthesis?.speaking ?? false
  }

  isListening(): boolean {
    return this.recognition !== null
  }
}

export class SpeechError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SpeechError'
  }
}
