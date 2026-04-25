interface ImageResizeOptions {
  width?: number
  height?: number
  quality?: number
  type?: 'image/jpeg' | 'image/png' | 'image/webp'
}

export class Media {
  private constructor() {}

  static async resize(file: File, options: ImageResizeOptions = {}): Promise<Blob> {
    const { width, height, quality = 0.9, type = 'image/jpeg' } = options

    const img = await Media.loadImage(file)

    let targetWidth = width || img.width
    let targetHeight = height || img.height

    // Maintain aspect ratio if only one dimension provided
    if (width && !height) {
      targetHeight = (img.height / img.width) * width
    } else if (height && !width) {
      targetWidth = (img.width / img.height) * height
    }

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight

    const ctx = canvas.getContext('2d')
    ctx?.drawImage(img, 0, 0, targetWidth, targetHeight)

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new MediaError('Resize failed')),
        type,
        quality
      )
    })
  }

  static async toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new MediaError('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  static async toArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(new MediaError('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  static async toText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new MediaError('Failed to read file'))
      reader.readAsText(file)
    })
  }

  private static loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new MediaError('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }
}

export class MediaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MediaError'
  }
}
