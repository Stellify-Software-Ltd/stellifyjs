type NotificationOptions = {
  body?: string
  icon?: string
  badge?: string
  tag?: string
  silent?: boolean
  data?: unknown
  requireInteraction?: boolean
}

type Permission = 'granted' | 'denied' | 'default'

export class Notify {
  private constructor() {}

  static async request(): Promise<Permission> {
    if (!Notify.isSupported()) {
      return 'denied'
    }

    try {
      const permission = await Notification.requestPermission()
      return permission as Permission
    } catch {
      return 'denied'
    }
  }

  static async send(title: string, options: NotificationOptions = {}): Promise<Notification | null> {
    if (!Notify.isSupported()) {
      return null
    }

    const permission = Notify.getPermission()
    if (permission !== 'granted') {
      const newPermission = await Notify.request()
      if (newPermission !== 'granted') {
        return null
      }
    }

    try {
      return new Notification(title, options)
    } catch {
      return null
    }
  }

  static getPermission(): Permission {
    if (!Notify.isSupported()) {
      return 'denied'
    }
    return Notification.permission as Permission
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window
  }

  static isGranted(): boolean {
    return Notify.getPermission() === 'granted'
  }

  static isDenied(): boolean {
    return Notify.getPermission() === 'denied'
  }
}
