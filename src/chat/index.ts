type Role = 'system' | 'user' | 'assistant' | 'function' | 'tool'

interface Message {
  id: string
  role: Role
  content: string
  timestamp: number
  metadata?: Record<string, unknown>
}

interface ChatOptions {
  systemPrompt?: string
  maxMessages?: number
}

export class Chat {
  private messages: Message[] = []
  private maxMessages: number | null = null

  private constructor() {}

  static create(options: ChatOptions = {}): Chat {
    const chat = new Chat()

    if (options.systemPrompt) {
      chat.addMessage('system', options.systemPrompt)
    }

    if (options.maxMessages) {
      chat.maxMessages = options.maxMessages
    }

    return chat
  }

  static fromHistory(messages: Array<{ role: Role; content: string }>): Chat {
    const chat = new Chat()
    messages.forEach(m => chat.addMessage(m.role, m.content))
    return chat
  }

  addMessage(role: Role, content: string, metadata?: Record<string, unknown>): this {
    const message: Message = {
      id: this.generateId(),
      role,
      content,
      timestamp: Date.now(),
      metadata
    }

    this.messages.push(message)
    this.enforceMaxMessages()
    return this
  }

  addUser(content: string): this {
    return this.addMessage('user', content)
  }

  addAssistant(content: string): this {
    return this.addMessage('assistant', content)
  }

  addSystem(content: string): this {
    return this.addMessage('system', content)
  }

  getMessage(id: string): Message | undefined {
    return this.messages.find(m => m.id === id)
  }

  getHistory(): Message[] {
    return [...this.messages]
  }

  getMessages(): Array<{ role: Role; content: string }> {
    return this.messages.map(m => ({ role: m.role, content: m.content }))
  }

  getLastMessage(): Message | undefined {
    return this.messages[this.messages.length - 1]
  }

  getLastUserMessage(): Message | undefined {
    return [...this.messages].reverse().find(m => m.role === 'user')
  }

  getLastAssistantMessage(): Message | undefined {
    return [...this.messages].reverse().find(m => m.role === 'assistant')
  }

  updateMessage(id: string, content: string): this {
    const message = this.messages.find(m => m.id === id)
    if (message) {
      message.content = content
      message.timestamp = Date.now()
    }
    return this
  }

  removeMessage(id: string): this {
    const index = this.messages.findIndex(m => m.id === id)
    if (index !== -1) {
      this.messages.splice(index, 1)
    }
    return this
  }

  clear(): this {
    // Keep system messages
    this.messages = this.messages.filter(m => m.role === 'system')
    return this
  }

  clearAll(): this {
    this.messages = []
    return this
  }

  fork(fromMessageId?: string): Chat {
    const chat = new Chat()
    chat.maxMessages = this.maxMessages

    if (fromMessageId) {
      const index = this.messages.findIndex(m => m.id === fromMessageId)
      if (index !== -1) {
        chat.messages = this.messages.slice(0, index + 1).map(m => ({ ...m }))
      }
    } else {
      chat.messages = this.messages.map(m => ({ ...m }))
    }

    return chat
  }

  truncate(keepCount: number): this {
    // Always keep system messages at the start
    const systemMessages = this.messages.filter(m => m.role === 'system')
    const nonSystemMessages = this.messages.filter(m => m.role !== 'system')

    this.messages = [
      ...systemMessages,
      ...nonSystemMessages.slice(-keepCount)
    ]

    return this
  }

  count(): number {
    return this.messages.length
  }

  countTokensEstimate(): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(
      this.messages.reduce((sum, m) => sum + m.content.length, 0) / 4
    )
  }

  toJSON(): string {
    return JSON.stringify(this.messages)
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }

  private enforceMaxMessages(): void {
    if (this.maxMessages && this.messages.length > this.maxMessages) {
      // Keep system messages, truncate the rest
      const systemMessages = this.messages.filter(m => m.role === 'system')
      const nonSystemMessages = this.messages.filter(m => m.role !== 'system')

      this.messages = [
        ...systemMessages,
        ...nonSystemMessages.slice(-(this.maxMessages - systemMessages.length))
      ]
    }
  }
}
