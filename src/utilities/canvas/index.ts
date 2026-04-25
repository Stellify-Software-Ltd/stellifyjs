interface CanvasOptions {
  width?: number
  height?: number
  background?: string
}

interface DrawStyle {
  fill?: string
  stroke?: string
  lineWidth?: number
  lineCap?: CanvasLineCap
  lineJoin?: CanvasLineJoin
  globalAlpha?: number
  shadowColor?: string
  shadowBlur?: number
  shadowOffsetX?: number
  shadowOffsetY?: number
}

interface TextStyle extends DrawStyle {
  font?: string
  textAlign?: CanvasTextAlign
  textBaseline?: CanvasTextBaseline
}

export class Canvas {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private stateStack: DrawStyle[] = []

  private constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new CanvasError('Could not get 2D context')
    }
    this.ctx = ctx
  }

  static create(width: number = 400, height: number = 300): Canvas {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return new Canvas(canvas)
  }

  static fromElement(element: HTMLCanvasElement): Canvas {
    return new Canvas(element)
  }

  static fromSelector(selector: string): Canvas {
    const element = document.querySelector(selector)
    if (!(element instanceof HTMLCanvasElement)) {
      throw new CanvasError(`Element not found or not a canvas: ${selector}`)
    }
    return new Canvas(element)
  }

  // Sizing
  size(width: number, height: number): this {
    this.canvas.width = width
    this.canvas.height = height
    return this
  }

  getWidth(): number {
    return this.canvas.width
  }

  getHeight(): number {
    return this.canvas.height
  }

  // Style management
  style(style: DrawStyle): this {
    if (style.fill) this.ctx.fillStyle = style.fill
    if (style.stroke) this.ctx.strokeStyle = style.stroke
    if (style.lineWidth) this.ctx.lineWidth = style.lineWidth
    if (style.lineCap) this.ctx.lineCap = style.lineCap
    if (style.lineJoin) this.ctx.lineJoin = style.lineJoin
    if (style.globalAlpha !== undefined) this.ctx.globalAlpha = style.globalAlpha
    if (style.shadowColor) this.ctx.shadowColor = style.shadowColor
    if (style.shadowBlur !== undefined) this.ctx.shadowBlur = style.shadowBlur
    if (style.shadowOffsetX !== undefined) this.ctx.shadowOffsetX = style.shadowOffsetX
    if (style.shadowOffsetY !== undefined) this.ctx.shadowOffsetY = style.shadowOffsetY
    return this
  }

  save(): this {
    this.ctx.save()
    return this
  }

  restore(): this {
    this.ctx.restore()
    return this
  }

  // Drawing primitives
  clear(): this {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    return this
  }

  fill(color: string): this {
    this.ctx.fillStyle = color
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    return this
  }

  rect(x: number, y: number, width: number, height: number, style?: DrawStyle): this {
    if (style) this.style(style)
    if (style?.fill) this.ctx.fillRect(x, y, width, height)
    if (style?.stroke) this.ctx.strokeRect(x, y, width, height)
    if (!style?.fill && !style?.stroke) this.ctx.fillRect(x, y, width, height)
    return this
  }

  circle(cx: number, cy: number, radius: number, style?: DrawStyle): this {
    if (style) this.style(style)
    this.ctx.beginPath()
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    if (style?.fill !== undefined) this.ctx.fill()
    if (style?.stroke) this.ctx.stroke()
    if (!style?.fill && !style?.stroke) this.ctx.fill()
    return this
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, style?: DrawStyle): this {
    if (style) this.style(style)
    this.ctx.beginPath()
    this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    if (style?.fill !== undefined) this.ctx.fill()
    if (style?.stroke) this.ctx.stroke()
    if (!style?.fill && !style?.stroke) this.ctx.fill()
    return this
  }

  line(x1: number, y1: number, x2: number, y2: number, style?: DrawStyle): this {
    if (style) this.style(style)
    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.stroke()
    return this
  }

  polyline(points: Array<[number, number]>, style?: DrawStyle): this {
    if (points.length < 2) return this
    if (style) this.style(style)

    this.ctx.beginPath()
    this.ctx.moveTo(points[0][0], points[0][1])
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i][0], points[i][1])
    }
    this.ctx.stroke()
    return this
  }

  polygon(points: Array<[number, number]>, style?: DrawStyle): this {
    if (points.length < 3) return this
    if (style) this.style(style)

    this.ctx.beginPath()
    this.ctx.moveTo(points[0][0], points[0][1])
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i][0], points[i][1])
    }
    this.ctx.closePath()

    if (style?.fill !== undefined) this.ctx.fill()
    if (style?.stroke) this.ctx.stroke()
    if (!style?.fill && !style?.stroke) this.ctx.fill()
    return this
  }

  arc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, style?: DrawStyle): this {
    if (style) this.style(style)
    this.ctx.beginPath()
    this.ctx.arc(cx, cy, radius, startAngle, endAngle)
    if (style?.fill) this.ctx.fill()
    this.ctx.stroke()
    return this
  }

  path(d: string, style?: DrawStyle): this {
    if (style) this.style(style)
    const path = new Path2D(d)
    if (style?.fill !== undefined) this.ctx.fill(path)
    if (style?.stroke) this.ctx.stroke(path)
    if (!style?.fill && !style?.stroke) this.ctx.fill(path)
    return this
  }

  // Text
  text(text: string, x: number, y: number, style?: TextStyle): this {
    if (style) {
      this.style(style)
      if (style.font) this.ctx.font = style.font
      if (style.textAlign) this.ctx.textAlign = style.textAlign
      if (style.textBaseline) this.ctx.textBaseline = style.textBaseline
    }

    if (style?.stroke) {
      this.ctx.strokeText(text, x, y)
    }
    this.ctx.fillText(text, x, y)
    return this
  }

  measureText(text: string, font?: string): TextMetrics {
    if (font) this.ctx.font = font
    return this.ctx.measureText(text)
  }

  // Images
  async drawImage(source: string | HTMLImageElement, x: number, y: number, width?: number, height?: number): Promise<this> {
    const img = typeof source === 'string' ? await this.loadImage(source) : source

    if (width !== undefined && height !== undefined) {
      this.ctx.drawImage(img, x, y, width, height)
    } else {
      this.ctx.drawImage(img, x, y)
    }

    return this
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new CanvasError(`Failed to load image: ${src}`))
      img.src = src
    })
  }

  // Transformations
  translate(x: number, y: number): this {
    this.ctx.translate(x, y)
    return this
  }

  rotate(angle: number): this {
    this.ctx.rotate(angle)
    return this
  }

  scale(x: number, y: number): this {
    this.ctx.scale(x, y)
    return this
  }

  resetTransform(): this {
    this.ctx.resetTransform()
    return this
  }

  // Pixel manipulation
  getPixel(x: number, y: number): [number, number, number, number] {
    const data = this.ctx.getImageData(x, y, 1, 1).data
    return [data[0], data[1], data[2], data[3]]
  }

  setPixel(x: number, y: number, r: number, g: number, b: number, a: number = 255): this {
    const imageData = this.ctx.createImageData(1, 1)
    imageData.data[0] = r
    imageData.data[1] = g
    imageData.data[2] = b
    imageData.data[3] = a
    this.ctx.putImageData(imageData, x, y)
    return this
  }

  getImageData(x?: number, y?: number, width?: number, height?: number): ImageData {
    return this.ctx.getImageData(
      x ?? 0,
      y ?? 0,
      width ?? this.canvas.width,
      height ?? this.canvas.height
    )
  }

  putImageData(imageData: ImageData, x: number = 0, y: number = 0): this {
    this.ctx.putImageData(imageData, x, y)
    return this
  }

  // Export
  toDataURL(type: string = 'image/png', quality?: number): string {
    return this.canvas.toDataURL(type, quality)
  }

  toBlob(type: string = 'image/png', quality?: number): Promise<Blob | null> {
    return new Promise(resolve => {
      this.canvas.toBlob(resolve, type, quality)
    })
  }

  getElement(): HTMLCanvasElement {
    return this.canvas
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx
  }

  // Append to DOM
  appendTo(parent: HTMLElement | string): this {
    const target = typeof parent === 'string'
      ? document.querySelector(parent)
      : parent

    if (!target) {
      throw new CanvasError('Parent element not found')
    }

    target.appendChild(this.canvas)
    return this
  }
}

export class CanvasError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CanvasError'
  }
}
