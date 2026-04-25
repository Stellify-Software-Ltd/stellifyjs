type ChangeType = 'insert' | 'delete' | 'equal'

interface Change {
  type: ChangeType
  value: string
  oldStart?: number
  oldEnd?: number
  newStart?: number
  newEnd?: number
}

interface DiffOptions {
  ignoreCase?: boolean
  ignoreWhitespace?: boolean
  trimLines?: boolean
}

interface PatchHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: string[]
}

export class Diff {
  private constructor() {}

  static chars(oldStr: string, newStr: string, options: DiffOptions = {}): Change[] {
    const a = options.ignoreCase ? oldStr.toLowerCase() : oldStr
    const b = options.ignoreCase ? newStr.toLowerCase() : newStr

    return Diff.computeDiff(a.split(''), b.split(''), oldStr.split(''), newStr.split(''))
  }

  static words(oldStr: string, newStr: string, options: DiffOptions = {}): Change[] {
    const tokenize = (str: string) => {
      let s = options.ignoreCase ? str.toLowerCase() : str
      if (options.ignoreWhitespace) {
        s = s.replace(/\s+/g, ' ')
      }
      return s.split(/(\s+)/)
    }

    const a = tokenize(oldStr)
    const b = tokenize(newStr)
    const origA = oldStr.split(/(\s+)/)
    const origB = newStr.split(/(\s+)/)

    return Diff.computeDiff(a, b, origA, origB)
  }

  static lines(oldStr: string, newStr: string, options: DiffOptions = {}): Change[] {
    const splitLines = (str: string) => {
      let lines = str.split('\n')
      if (options.trimLines) {
        lines = lines.map(l => l.trim())
      }
      if (options.ignoreCase) {
        lines = lines.map(l => l.toLowerCase())
      }
      return lines
    }

    const a = splitLines(oldStr)
    const b = splitLines(newStr)
    const origA = oldStr.split('\n')
    const origB = newStr.split('\n')

    return Diff.computeDiff(a, b, origA, origB)
  }

  private static computeDiff(a: string[], b: string[], origA: string[], origB: string[]): Change[] {
    // Myers' diff algorithm
    const n = a.length
    const m = b.length
    const max = n + m
    const v: Record<number, number> = { 1: 0 }
    const trace: Array<Record<number, number>> = []

    outer:
    for (let d = 0; d <= max; d++) {
      trace.push({ ...v })

      for (let k = -d; k <= d; k += 2) {
        let x: number
        if (k === -d || (k !== d && v[k - 1] < v[k + 1])) {
          x = v[k + 1]
        } else {
          x = v[k - 1] + 1
        }

        let y = x - k

        while (x < n && y < m && a[x] === b[y]) {
          x++
          y++
        }

        v[k] = x

        if (x >= n && y >= m) {
          break outer
        }
      }
    }

    // Backtrack to find the path
    const changes: Change[] = []
    let x = n
    let y = m

    for (let d = trace.length - 1; d >= 0; d--) {
      const v = trace[d]
      const k = x - y

      let prevK: number
      if (k === -d || (k !== d && v[k - 1] < v[k + 1])) {
        prevK = k + 1
      } else {
        prevK = k - 1
      }

      const prevX = v[prevK]
      const prevY = prevX - prevK

      // Diagonal moves (equal)
      while (x > prevX && y > prevY) {
        x--
        y--
        changes.unshift({
          type: 'equal',
          value: origA[x],
          oldStart: x,
          oldEnd: x + 1,
          newStart: y,
          newEnd: y + 1
        })
      }

      if (d > 0) {
        if (x === prevX) {
          // Insert
          y--
          changes.unshift({
            type: 'insert',
            value: origB[y],
            newStart: y,
            newEnd: y + 1
          })
        } else {
          // Delete
          x--
          changes.unshift({
            type: 'delete',
            value: origA[x],
            oldStart: x,
            oldEnd: x + 1
          })
        }
      }
    }

    return Diff.mergeChanges(changes)
  }

  private static mergeChanges(changes: Change[]): Change[] {
    if (changes.length === 0) return []

    const merged: Change[] = []
    let current = { ...changes[0] }

    for (let i = 1; i < changes.length; i++) {
      const change = changes[i]

      if (change.type === current.type) {
        current.value += change.value
        if (change.oldEnd !== undefined) current.oldEnd = change.oldEnd
        if (change.newEnd !== undefined) current.newEnd = change.newEnd
      } else {
        merged.push(current)
        current = { ...change }
      }
    }

    merged.push(current)
    return merged
  }

  static apply(original: string, changes: Change[]): string {
    let result = ''

    for (const change of changes) {
      if (change.type === 'equal' || change.type === 'insert') {
        result += change.value
      }
    }

    return result
  }

  static createPatch(filename: string, oldStr: string, newStr: string, context: number = 3): string {
    const changes = Diff.lines(oldStr, newStr)
    const oldLines = oldStr.split('\n')
    const newLines = newStr.split('\n')

    // Group changes into hunks
    const hunks: PatchHunk[] = []
    let currentHunk: PatchHunk | null = null
    let oldIndex = 0
    let newIndex = 0

    for (const change of changes) {
      const lineCount = change.value.split('\n').filter(l => l !== '').length || 1

      if (change.type !== 'equal') {
        if (!currentHunk) {
          const start = Math.max(0, oldIndex - context)
          currentHunk = {
            oldStart: start + 1,
            oldLines: 0,
            newStart: start + 1,
            newLines: 0,
            lines: []
          }

          // Add context before
          for (let i = start; i < oldIndex; i++) {
            currentHunk.lines.push(' ' + oldLines[i])
            currentHunk.oldLines++
            currentHunk.newLines++
          }
        }

        if (change.type === 'delete') {
          for (let i = 0; i < lineCount; i++) {
            currentHunk.lines.push('-' + oldLines[oldIndex + i])
            currentHunk.oldLines++
          }
        } else {
          for (let i = 0; i < lineCount; i++) {
            currentHunk.lines.push('+' + newLines[newIndex + i])
            currentHunk.newLines++
          }
        }
      } else if (currentHunk) {
        // Add context after and possibly close hunk
        const contextLines = Math.min(lineCount, context)

        for (let i = 0; i < contextLines; i++) {
          currentHunk.lines.push(' ' + oldLines[oldIndex + i])
          currentHunk.oldLines++
          currentHunk.newLines++
        }

        if (lineCount > context * 2) {
          // Close current hunk
          hunks.push(currentHunk)
          currentHunk = null
        }
      }

      if (change.type === 'delete' || change.type === 'equal') {
        oldIndex += lineCount
      }
      if (change.type === 'insert' || change.type === 'equal') {
        newIndex += lineCount
      }
    }

    if (currentHunk) {
      hunks.push(currentHunk)
    }

    // Format patch
    let patch = `--- ${filename}\n+++ ${filename}\n`

    for (const hunk of hunks) {
      patch += `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@\n`
      patch += hunk.lines.join('\n') + '\n'
    }

    return patch
  }

  static distance(a: string, b: string): number {
    // Levenshtein distance
    const m = a.length
    const n = b.length

    if (m === 0) return n
    if (n === 0) return m

    const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

    for (let i = 0; i <= m; i++) d[i][0] = i
    for (let j = 0; j <= n; j++) d[0][j] = j

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1
        d[i][j] = Math.min(
          d[i - 1][j] + 1,      // deletion
          d[i][j - 1] + 1,      // insertion
          d[i - 1][j - 1] + cost // substitution
        )
      }
    }

    return d[m][n]
  }

  static similarity(a: string, b: string): number {
    const maxLen = Math.max(a.length, b.length)
    if (maxLen === 0) return 1
    return 1 - Diff.distance(a, b) / maxLen
  }

  static commonPrefix(a: string, b: string): string {
    let i = 0
    while (i < a.length && i < b.length && a[i] === b[i]) {
      i++
    }
    return a.slice(0, i)
  }

  static commonSuffix(a: string, b: string): string {
    let i = 0
    while (
      i < a.length &&
      i < b.length &&
      a[a.length - 1 - i] === b[b.length - 1 - i]
    ) {
      i++
    }
    return a.slice(a.length - i)
  }
}
