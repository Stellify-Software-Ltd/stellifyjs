type Orientation = 'top' | 'bottom' | 'left' | 'right'

interface Tick {
  value: number | string | Date
  position: number
  label: string
}

interface AxisConfig {
  orientation: Orientation
  tickCount: number
  tickFormat: (value: number | string | Date) => string
  tickSize: number
}

interface ScaleLike {
  value(input: unknown): number
  ticks(count?: number): Array<number | string | Date>
  getRange(): [number, number]
}

export class Axis {
  private scale: ScaleLike
  private config: AxisConfig

  private constructor(scale: ScaleLike) {
    this.scale = scale
    this.config = {
      orientation: 'bottom',
      tickCount: 10,
      tickFormat: (v) => String(v),
      tickSize: 6
    }
  }

  static create(scale: ScaleLike): Axis {
    return new Axis(scale)
  }

  orientation(value: Orientation): Axis {
    this.config.orientation = value
    return this
  }

  ticks(count: number): Axis {
    this.config.tickCount = count
    return this
  }

  tickFormat(formatter: (value: number | string | Date) => string): Axis {
    this.config.tickFormat = formatter
    return this
  }

  tickSize(size: number): Axis {
    this.config.tickSize = size
    return this
  }

  getTicks(): Tick[] {
    const tickValues = this.scale.ticks(this.config.tickCount)

    return tickValues.map(value => ({
      value,
      position: this.scale.value(value),
      label: this.config.tickFormat(value)
    }))
  }

  getOrientation(): Orientation {
    return this.config.orientation
  }

  getTickSize(): number {
    return this.config.tickSize
  }

  getRange(): [number, number] {
    return this.scale.getRange()
  }

  isHorizontal(): boolean {
    return this.config.orientation === 'top' || this.config.orientation === 'bottom'
  }

  isVertical(): boolean {
    return this.config.orientation === 'left' || this.config.orientation === 'right'
  }
}
