type TimeUnit = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'
type DateInput = Date | string | number

export class Time {
  private date: Date

  private constructor(date: DateInput = new Date()) {
    if (date instanceof Date) {
      this.date = new Date(date.getTime())
    } else if (typeof date === 'string') {
      this.date = new Date(date)
    } else {
      this.date = new Date(date)
    }
  }

  static now(): Time {
    return new Time()
  }

  static create(date: DateInput = new Date()): Time {
    return new Time(date)
  }

  static parse(str: string, pattern?: string): Time {
    // Basic parsing - for complex patterns, use a library
    return new Time(str)
  }

  format(pattern: string): string {
    const d = this.date
    const tokens: Record<string, string> = {
      'YYYY': d.getFullYear().toString(),
      'YY': d.getFullYear().toString().slice(-2),
      'MM': String(d.getMonth() + 1).padStart(2, '0'),
      'M': String(d.getMonth() + 1),
      'DD': String(d.getDate()).padStart(2, '0'),
      'D': String(d.getDate()),
      'HH': String(d.getHours()).padStart(2, '0'),
      'H': String(d.getHours()),
      'hh': String(d.getHours() % 12 || 12).padStart(2, '0'),
      'h': String(d.getHours() % 12 || 12),
      'mm': String(d.getMinutes()).padStart(2, '0'),
      'm': String(d.getMinutes()),
      'ss': String(d.getSeconds()).padStart(2, '0'),
      's': String(d.getSeconds()),
      'SSS': String(d.getMilliseconds()).padStart(3, '0'),
      'A': d.getHours() >= 12 ? 'PM' : 'AM',
      'a': d.getHours() >= 12 ? 'pm' : 'am'
    }

    let result = pattern
    // Sort by length descending to replace longer tokens first
    const sortedKeys = Object.keys(tokens).sort((a, b) => b.length - a.length)
    for (const key of sortedKeys) {
      result = result.replace(new RegExp(key, 'g'), tokens[key])
    }

    return result
  }

  toISO(): string {
    return this.date.toISOString()
  }

  toDate(): Date {
    return new Date(this.date.getTime())
  }

  toTimestamp(): number {
    return this.date.getTime()
  }

  toUnix(): number {
    return Math.floor(this.date.getTime() / 1000)
  }

  add(amount: number, unit: TimeUnit): Time {
    const ms = this.unitToMs(amount, unit)
    return new Time(this.date.getTime() + ms)
  }

  subtract(amount: number, unit: TimeUnit): Time {
    return this.add(-amount, unit)
  }

  diff(other: DateInput, unit: TimeUnit = 'milliseconds'): number {
    const otherTime = new Time(other)
    const diffMs = this.date.getTime() - otherTime.date.getTime()
    return this.msToUnit(diffMs, unit)
  }

  isBefore(other: DateInput): boolean {
    return this.date.getTime() < new Time(other).date.getTime()
  }

  isAfter(other: DateInput): boolean {
    return this.date.getTime() > new Time(other).date.getTime()
  }

  isSame(other: DateInput, unit?: TimeUnit): boolean {
    if (!unit) {
      return this.date.getTime() === new Time(other).date.getTime()
    }

    return this.startOf(unit).date.getTime() === new Time(other).startOf(unit).date.getTime()
  }

  isBetween(start: DateInput, end: DateInput): boolean {
    const t = this.date.getTime()
    return t >= new Time(start).date.getTime() && t <= new Time(end).date.getTime()
  }

  startOf(unit: TimeUnit): Time {
    const d = new Date(this.date.getTime())

    switch (unit) {
      case 'years':
        d.setMonth(0, 1)
        d.setHours(0, 0, 0, 0)
        break
      case 'months':
        d.setDate(1)
        d.setHours(0, 0, 0, 0)
        break
      case 'weeks':
        d.setDate(d.getDate() - d.getDay())
        d.setHours(0, 0, 0, 0)
        break
      case 'days':
        d.setHours(0, 0, 0, 0)
        break
      case 'hours':
        d.setMinutes(0, 0, 0)
        break
      case 'minutes':
        d.setSeconds(0, 0)
        break
      case 'seconds':
        d.setMilliseconds(0)
        break
    }

    return new Time(d)
  }

  endOf(unit: TimeUnit): Time {
    return this.startOf(unit).add(1, unit).subtract(1, 'milliseconds')
  }

  year(): number {
    return this.date.getFullYear()
  }

  month(): number {
    return this.date.getMonth() + 1
  }

  day(): number {
    return this.date.getDate()
  }

  weekday(): number {
    return this.date.getDay()
  }

  hour(): number {
    return this.date.getHours()
  }

  minute(): number {
    return this.date.getMinutes()
  }

  second(): number {
    return this.date.getSeconds()
  }

  relative(baseDate?: DateInput): string {
    const base = baseDate ? new Time(baseDate).date : new Date()
    const diffMs = base.getTime() - this.date.getTime()
    const absDiff = Math.abs(diffMs)
    const isFuture = diffMs < 0

    const seconds = Math.floor(absDiff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    let value: number
    let unit: string

    if (years > 0) {
      value = years
      unit = years === 1 ? 'year' : 'years'
    } else if (months > 0) {
      value = months
      unit = months === 1 ? 'month' : 'months'
    } else if (days > 0) {
      value = days
      unit = days === 1 ? 'day' : 'days'
    } else if (hours > 0) {
      value = hours
      unit = hours === 1 ? 'hour' : 'hours'
    } else if (minutes > 0) {
      value = minutes
      unit = minutes === 1 ? 'minute' : 'minutes'
    } else {
      return isFuture ? 'in a moment' : 'just now'
    }

    return isFuture ? `in ${value} ${unit}` : `${value} ${unit} ago`
  }

  clone(): Time {
    return new Time(this.date)
  }

  private unitToMs(amount: number, unit: TimeUnit): number {
    switch (unit) {
      case 'milliseconds':
        return amount
      case 'seconds':
        return amount * 1000
      case 'minutes':
        return amount * 60 * 1000
      case 'hours':
        return amount * 60 * 60 * 1000
      case 'days':
        return amount * 24 * 60 * 60 * 1000
      case 'weeks':
        return amount * 7 * 24 * 60 * 60 * 1000
      case 'months':
        return amount * 30 * 24 * 60 * 60 * 1000
      case 'years':
        return amount * 365 * 24 * 60 * 60 * 1000
    }
  }

  private msToUnit(ms: number, unit: TimeUnit): number {
    switch (unit) {
      case 'milliseconds':
        return ms
      case 'seconds':
        return ms / 1000
      case 'minutes':
        return ms / (60 * 1000)
      case 'hours':
        return ms / (60 * 60 * 1000)
      case 'days':
        return ms / (24 * 60 * 60 * 1000)
      case 'weeks':
        return ms / (7 * 24 * 60 * 60 * 1000)
      case 'months':
        return ms / (30 * 24 * 60 * 60 * 1000)
      case 'years':
        return ms / (365 * 24 * 60 * 60 * 1000)
    }
  }
}
