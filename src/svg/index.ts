type Attributes = Record<string, string | number>

interface SvgElement {
  tag: string
  attrs: Attributes
  children: SvgElement[]
  text?: string
}

export class Svg {
  private element: SVGElement | null
  private root: SvgElement | null
  private current: SvgElement | null
  private width: number
  private height: number

  private constructor(width?: number, height?: number) {
    this.element = null
    this.root = null
    this.current = null
    this.width = width || 0
    this.height = height || 0

    if (width && height) {
      this.root = {
        tag: 'svg',
        attrs: { width, height, xmlns: 'http://www.w3.org/2000/svg' },
        children: []
      }
      this.current = this.root
    }
  }

  // Create new SVG from scratch
  static create(width: number, height: number): Svg {
    return new Svg(width, height)
  }

  // Select existing SVG element from DOM
  static select(selector: string): Svg {
    const svg = new Svg()
    svg.element = document.querySelector(selector) as SVGElement
    return svg
  }

  // Select child element within current context
  find(selector: string): Svg {
    if (this.element) {
      const newSvg = new Svg()
      newSvg.element = this.element.querySelector(selector) as SVGElement
      return newSvg
    }
    return this
  }

  // Set attributes on current element
  attr(name: string, value: string | number): Svg {
    if (this.element) {
      this.element.setAttribute(name, String(value))
    }
    if (this.current) {
      this.current.attrs[name] = value
    }
    return this
  }

  // Set multiple attributes
  attrs(attributes: Attributes): Svg {
    for (const [name, value] of Object.entries(attributes)) {
      this.attr(name, value)
    }
    return this
  }

  // Get attribute value
  getAttr(name: string): string | null {
    if (this.element) {
      return this.element.getAttribute(name)
    }
    if (this.current) {
      return String(this.current.attrs[name] || null)
    }
    return null
  }

  // Add CSS class
  addClass(className: string): Svg {
    if (this.element) {
      this.element.classList.add(className)
    }
    if (this.current) {
      const existing = this.current.attrs.class || ''
      this.current.attrs.class = `${existing} ${className}`.trim()
    }
    return this
  }

  // Remove CSS class
  removeClass(className: string): Svg {
    if (this.element) {
      this.element.classList.remove(className)
    }
    return this
  }

  // Set text content
  text(content: string): Svg {
    if (this.element) {
      this.element.textContent = content
    }
    if (this.current) {
      this.current.text = content
    }
    return this
  }

  // Append rectangle
  rect(x: number, y: number, width: number, height: number, attrs?: Attributes): Svg {
    return this.appendElement('rect', { x, y, width, height, ...attrs })
  }

  // Append circle
  circle(cx: number, cy: number, r: number, attrs?: Attributes): Svg {
    return this.appendElement('circle', { cx, cy, r, ...attrs })
  }

  // Append ellipse
  ellipse(cx: number, cy: number, rx: number, ry: number, attrs?: Attributes): Svg {
    return this.appendElement('ellipse', { cx, cy, rx, ry, ...attrs })
  }

  // Append line
  line(x1: number, y1: number, x2: number, y2: number, attrs?: Attributes): Svg {
    return this.appendElement('line', { x1, y1, x2, y2, ...attrs })
  }

  // Append polyline
  polyline(points: [number, number][], attrs?: Attributes): Svg {
    const pointsStr = points.map(p => p.join(',')).join(' ')
    return this.appendElement('polyline', { points: pointsStr, ...attrs })
  }

  // Append polygon
  polygon(points: [number, number][], attrs?: Attributes): Svg {
    const pointsStr = points.map(p => p.join(',')).join(' ')
    return this.appendElement('polygon', { points: pointsStr, ...attrs })
  }

  // Append path
  path(d: string, attrs?: Attributes): Svg {
    return this.appendElement('path', { d, ...attrs })
  }

  // Append text element
  textElement(x: number, y: number, content: string, attrs?: Attributes): Svg {
    const svg = this.appendElement('text', { x, y, ...attrs })
    if (this.element) {
      const textEl = this.element.lastElementChild
      if (textEl) textEl.textContent = content
    }
    if (this.current && this.current.children.length > 0) {
      this.current.children[this.current.children.length - 1].text = content
    }
    return svg
  }

  // Append group
  group(attrs?: Attributes): Svg {
    return this.appendElement('g', attrs || {})
  }

  // Generic append
  private appendElement(tag: string, attrs: Attributes): Svg {
    if (this.element) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', tag)
      for (const [name, value] of Object.entries(attrs)) {
        el.setAttribute(name, String(value))
      }
      this.element.appendChild(el)
    }

    if (this.current) {
      const child: SvgElement = { tag, attrs, children: [] }
      this.current.children.push(child)
    }

    return this
  }

  // Remove all children
  clear(): Svg {
    if (this.element) {
      this.element.innerHTML = ''
    }
    if (this.current) {
      this.current.children = []
    }
    return this
  }

  // Remove element from DOM
  remove(): void {
    if (this.element) {
      this.element.remove()
    }
  }

  // Get SVG as string (for created SVGs)
  toString(): string {
    if (!this.root) return ''
    return this.elementToString(this.root)
  }

  private elementToString(el: SvgElement): string {
    const attrs = Object.entries(el.attrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ')

    const open = attrs ? `<${el.tag} ${attrs}>` : `<${el.tag}>`
    const close = `</${el.tag}>`
    const children = el.children.map(c => this.elementToString(c)).join('')
    const text = el.text || ''

    return `${open}${text}${children}${close}`
  }

  // Get DOM element (for mounting)
  toElement(): SVGElement | null {
    if (this.element) return this.element

    if (this.root) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(this.toString(), 'image/svg+xml')
      return doc.documentElement as unknown as SVGElement
    }

    return null
  }

  // Get dimensions
  getWidth(): number {
    if (this.element) {
      return Number(this.element.getAttribute('width')) || this.element.getBoundingClientRect().width
    }
    return this.width
  }

  getHeight(): number {
    if (this.element) {
      return Number(this.element.getAttribute('height')) || this.element.getBoundingClientRect().height
    }
    return this.height
  }
}
