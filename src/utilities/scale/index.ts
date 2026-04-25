type ScaleType = 'linear' | 'log' | 'time' | 'band'

interface BaseScale {
  value(input: number | Date | string): number
  invert(output: number): number | Date | string
  ticks(count?: number): Array<number | Date | string>
  domain(values: [number | Date | string, number | Date | string]): this
  range(values: [number, number]): this
  getDomain(): [number | Date | string, number | Date | string]
  getRange(): [number, number]
}

export class Scale {
  static linear(): LinearScale {
    return new LinearScale()
  }

  static log(base: number = 10): LogScale {
    return new LogScale(base)
  }

  static time(): TimeScale {
    return new TimeScale()
  }

  static band(): BandScale {
    return new BandScale()
  }
}

class LinearScale implements BaseScale {
  private _domain: [number, number] = [0, 1]
  private _range: [number, number] = [0, 1]

  domain(values: [number, number]): this {
    this._domain = values
    return this
  }

  range(values: [number, number]): this {
    this._range = values
    return this
  }

  getDomain(): [number, number] {
    return [...this._domain]
  }

  getRange(): [number, number] {
    return [...this._range]
  }

  value(input: number): number {
    const [d0, d1] = this._domain
    const [r0, r1] = this._range
    const ratio = (input - d0) / (d1 - d0)
    return r0 + ratio * (r1 - r0)
  }

  invert(output: number): number {
    const [d0, d1] = this._domain
    const [r0, r1] = this._range
    const ratio = (output - r0) / (r1 - r0)
    return d0 + ratio * (d1 - d0)
  }

  ticks(count: number = 10): number[] {
    const [d0, d1] = this._domain
    const step = (d1 - d0) / count
    const ticks: number[] = []
    for (let i = 0; i <= count; i++) {
      ticks.push(d0 + step * i)
    }
    return ticks
  }

  clamp(enabled: boolean = true): this {
    // Could implement clamping logic
    return this
  }
}

class LogScale implements BaseScale {
  private _domain: [number, number] = [1, 10]
  private _range: [number, number] = [0, 1]
  private _base: number

  constructor(base: number = 10) {
    this._base = base
  }

  domain(values: [number, number]): this {
    this._domain = values
    return this
  }

  range(values: [number, number]): this {
    this._range = values
    return this
  }

  getDomain(): [number, number] {
    return [...this._domain]
  }

  getRange(): [number, number] {
    return [...this._range]
  }

  value(input: number): number {
    const [d0, d1] = this._domain
    const [r0, r1] = this._range
    const logBase = Math.log(this._base)
    const logD0 = Math.log(d0) / logBase
    const logD1 = Math.log(d1) / logBase
    const logInput = Math.log(input) / logBase
    const ratio = (logInput - logD0) / (logD1 - logD0)
    return r0 + ratio * (r1 - r0)
  }

  invert(output: number): number {
    const [d0, d1] = this._domain
    const [r0, r1] = this._range
    const logBase = Math.log(this._base)
    const logD0 = Math.log(d0) / logBase
    const logD1 = Math.log(d1) / logBase
    const ratio = (output - r0) / (r1 - r0)
    const logValue = logD0 + ratio * (logD1 - logD0)
    return Math.pow(this._base, logValue)
  }

  ticks(count: number = 10): number[] {
    const [d0, d1] = this._domain
    const logBase = Math.log(this._base)
    const logD0 = Math.log(d0) / logBase
    const logD1 = Math.log(d1) / logBase
    const step = (logD1 - logD0) / count
    const ticks: number[] = []
    for (let i = 0; i <= count; i++) {
      ticks.push(Math.pow(this._base, logD0 + step * i))
    }
    return ticks
  }
}

class TimeScale implements BaseScale {
  private _domain: [Date, Date] = [new Date(0), new Date()]
  private _range: [number, number] = [0, 1]

  domain(values: [Date, Date]): this {
    this._domain = values
    return this
  }

  range(values: [number, number]): this {
    this._range = values
    return this
  }

  getDomain(): [Date, Date] {
    return [new Date(this._domain[0]), new Date(this._domain[1])]
  }

  getRange(): [number, number] {
    return [...this._range]
  }

  value(input: Date): number {
    const [d0, d1] = this._domain
    const [r0, r1] = this._range
    const ratio = (input.getTime() - d0.getTime()) / (d1.getTime() - d0.getTime())
    return r0 + ratio * (r1 - r0)
  }

  invert(output: number): Date {
    const [d0, d1] = this._domain
    const [r0, r1] = this._range
    const ratio = (output - r0) / (r1 - r0)
    const time = d0.getTime() + ratio * (d1.getTime() - d0.getTime())
    return new Date(time)
  }

  ticks(count: number = 10): Date[] {
    const [d0, d1] = this._domain
    const step = (d1.getTime() - d0.getTime()) / count
    const ticks: Date[] = []
    for (let i = 0; i <= count; i++) {
      ticks.push(new Date(d0.getTime() + step * i))
    }
    return ticks
  }
}

class BandScale {
  private _domain: string[] = []
  private _range: [number, number] = [0, 1]
  private _padding: number = 0.1

  domain(values: string[]): this {
    this._domain = values
    return this
  }

  range(values: [number, number]): this {
    this._range = values
    return this
  }

  padding(value: number): this {
    this._padding = value
    return this
  }

  getDomain(): string[] {
    return [...this._domain]
  }

  getRange(): [number, number] {
    return [...this._range]
  }

  value(input: string): number {
    const index = this._domain.indexOf(input)
    if (index === -1) return 0

    const [r0, r1] = this._range
    const totalWidth = r1 - r0
    const bandCount = this._domain.length
    const paddingWidth = totalWidth * this._padding
    const bandWidth = (totalWidth - paddingWidth) / bandCount
    const step = totalWidth / bandCount

    return r0 + step * index + (step - bandWidth) / 2
  }

  bandwidth(): number {
    const [r0, r1] = this._range
    const totalWidth = r1 - r0
    const bandCount = this._domain.length || 1
    const paddingWidth = totalWidth * this._padding
    return (totalWidth - paddingWidth) / bandCount
  }

  ticks(): string[] {
    return [...this._domain]
  }

  invert(output: number): string {
    const [r0, r1] = this._range
    const step = (r1 - r0) / this._domain.length
    const index = Math.floor((output - r0) / step)
    return this._domain[Math.max(0, Math.min(index, this._domain.length - 1))]
  }
}
