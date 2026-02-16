import { useState, useCallback } from 'react'
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
  const [table] = useState(() => Table.create(initialRows))
  const [, forceUpdate] = useState(0)

  const rerender = useCallback(() => {
    forceUpdate(n => n + 1)
  }, [])

  const setData = useCallback((rows: Row[]) => {
    table.setData(rows)
    rerender()
    return table
  }, [table, rerender])

  const addColumn = useCallback((key: string, options: ColumnOptions = {}) => {
    table.addColumn(key, options)
    rerender()
    return table
  }, [table, rerender])

  const removeColumn = useCallback((key: string) => {
    table.removeColumn(key)
    rerender()
    return table
  }, [table, rerender])

  const sort = useCallback((key: string, direction: SortDirection = 'asc') => {
    table.sort(key, direction)
    rerender()
    return table
  }, [table, rerender])

  const filter = useCallback((predicate: FilterPredicate) => {
    table.filter(predicate)
    rerender()
    return table
  }, [table, rerender])

  const clearFilter = useCallback(() => {
    table.clearFilter()
    rerender()
    return table
  }, [table, rerender])

  const paginate = useCallback((pageSize: number) => {
    table.paginate(pageSize)
    rerender()
    return table
  }, [table, rerender])

  const page = useCallback((pageNumber: number) => {
    table.page(pageNumber)
    rerender()
    return table
  }, [table, rerender])

  return {
    setData,
    addColumn,
    removeColumn,
    sort,
    filter,
    clearFilter,
    paginate,
    page,
    getData: table.getData.bind(table),
    getAllData: table.getAllData.bind(table),
    getColumns: table.getColumns.bind(table),
    getColumn: table.getColumn.bind(table),
    getTotalRows: table.getTotalRows.bind(table),
    getTotalPages: table.getTotalPages.bind(table),
    getCurrentPage: table.getCurrentPage.bind(table),
    getPageSize: table.getPageSize.bind(table),
    getSortKey: table.getSortKey.bind(table),
    getSortDirection: table.getSortDirection.bind(table)
  }
}
