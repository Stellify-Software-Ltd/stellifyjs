type Row = Record<string, unknown>
type SortDirection = 'asc' | 'desc'
type FilterPredicate = (row: Row) => boolean
type ColumnOptions = {
  label?: string
  sortable?: boolean
  formatter?: (value: unknown) => string
}

interface Column {
  key: string
  options: ColumnOptions
}

export class Table {
  private rows: Row[]
  private originalRows: Row[]
  private columns: Column[]
  private sortKey: string | null
  private sortDirection: SortDirection
  private filterPredicate: FilterPredicate | null
  private pageSize: number | null
  private currentPage: number

  private constructor(rows: Row[] = []) {
    this.rows = [...rows]
    this.originalRows = [...rows]
    this.columns = []
    this.sortKey = null
    this.sortDirection = 'asc'
    this.filterPredicate = null
    this.pageSize = null
    this.currentPage = 1
  }

  static create(rows: Row[] = []): Table {
    return new Table(rows)
  }

  setData(rows: Row[]): Table {
    this.rows = [...rows]
    this.originalRows = [...rows]
    this.applyTransforms()
    return this
  }

  addColumn(key: string, options: ColumnOptions = {}): Table {
    this.columns.push({ key, options })
    return this
  }

  removeColumn(key: string): Table {
    this.columns = this.columns.filter(c => c.key !== key)
    return this
  }

  sort(key: string, direction: SortDirection = 'asc'): Table {
    this.sortKey = key
    this.sortDirection = direction
    this.applyTransforms()
    return this
  }

  filter(predicate: FilterPredicate): Table {
    this.filterPredicate = predicate
    this.applyTransforms()
    return this
  }

  clearFilter(): Table {
    this.filterPredicate = null
    this.applyTransforms()
    return this
  }

  paginate(pageSize: number): Table {
    this.pageSize = pageSize
    this.currentPage = 1
    return this
  }

  page(pageNumber: number): Table {
    this.currentPage = pageNumber
    return this
  }

  private applyTransforms(): void {
    let result = [...this.originalRows]

    if (this.filterPredicate) {
      result = result.filter(this.filterPredicate)
    }

    if (this.sortKey) {
      const key = this.sortKey
      const dir = this.sortDirection === 'asc' ? 1 : -1
      result.sort((a, b) => {
        const aVal = a[key]
        const bVal = b[key]
        if (aVal < bVal) return -1 * dir
        if (aVal > bVal) return 1 * dir
        return 0
      })
    }

    this.rows = result
  }

  getData(): Row[] {
    if (this.pageSize) {
      const start = (this.currentPage - 1) * this.pageSize
      return this.rows.slice(start, start + this.pageSize)
    }
    return [...this.rows]
  }

  getAllData(): Row[] {
    return [...this.rows]
  }

  getColumns(): Column[] {
    return [...this.columns]
  }

  getColumn(key: string): Column | null {
    return this.columns.find(c => c.key === key) || null
  }

  getTotalRows(): number {
    return this.rows.length
  }

  getTotalPages(): number {
    if (!this.pageSize) return 1
    return Math.ceil(this.rows.length / this.pageSize)
  }

  getCurrentPage(): number {
    return this.currentPage
  }

  getPageSize(): number | null {
    return this.pageSize
  }

  getSortKey(): string | null {
    return this.sortKey
  }

  getSortDirection(): SortDirection {
    return this.sortDirection
  }
}
