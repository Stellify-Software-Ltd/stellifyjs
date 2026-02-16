import { reactive } from 'vue'
import { Table } from '../../table'

type Row = Record<string, unknown>
type SortDirection = 'asc' | 'desc'
type FilterPredicate = (row: Row) => boolean
type ColumnOptions = {
  label?: string
  sortable?: boolean
  formatter?: (value: unknown) => string
}

export function useTable(initialRows: Row[] = []) {
  const table = Table.create(initialRows)

  const state = reactive({
    data: table.getData(),
    columns: table.getColumns(),
    totalRows: table.getTotalRows(),
    totalPages: table.getTotalPages(),
    currentPage: table.getCurrentPage(),
    pageSize: table.getPageSize(),
    sortKey: table.getSortKey(),
    sortDirection: table.getSortDirection()
  })

  const sync = () => {
    state.data = table.getData()
    state.columns = table.getColumns()
    state.totalRows = table.getTotalRows()
    state.totalPages = table.getTotalPages()
    state.currentPage = table.getCurrentPage()
    state.pageSize = table.getPageSize()
    state.sortKey = table.getSortKey()
    state.sortDirection = table.getSortDirection()
  }

  const setData = (rows: Row[]) => {
    table.setData(rows)
    sync()
    return table
  }

  const addColumn = (key: string, options: ColumnOptions = {}) => {
    table.addColumn(key, options)
    sync()
    return table
  }

  const removeColumn = (key: string) => {
    table.removeColumn(key)
    sync()
    return table
  }

  const sort = (key: string, direction: SortDirection = 'asc') => {
    table.sort(key, direction)
    sync()
    return table
  }

  const filter = (predicate: FilterPredicate) => {
    table.filter(predicate)
    sync()
    return table
  }

  const clearFilter = () => {
    table.clearFilter()
    sync()
    return table
  }

  const paginate = (pageSize: number) => {
    table.paginate(pageSize)
    sync()
    return table
  }

  const page = (pageNumber: number) => {
    table.page(pageNumber)
    sync()
    return table
  }

  return {
    setData,
    addColumn,
    removeColumn,
    sort,
    filter,
    clearFilter,
    paginate,
    page,
    state
  }
}
