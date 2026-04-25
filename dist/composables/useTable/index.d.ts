import { Table, Column } from '../../utilities/table';
type Row = Record<string, unknown>;
type SortDirection = 'asc' | 'desc';
type FilterPredicate = (row: Row) => boolean;
type ColumnOptions = {
    label?: string;
    sortable?: boolean;
    formatter?: (value: unknown) => string;
};
/**
 * Options for useTable (initial rows)
 */
export type TableOptions = Row[];
/**
 * Return type for useTable
 */
export interface TableReturn {
    setData: (rows: Row[]) => Table;
    addColumn: (key: string, options?: ColumnOptions) => Table;
    removeColumn: (key: string) => Table;
    sort: (key: string, direction?: SortDirection) => Table;
    filter: (predicate: FilterPredicate) => Table;
    clearFilter: () => Table;
    paginate: (pageSize: number) => Table;
    page: (pageNumber: number) => Table;
    state: {
        data: Row[];
        columns: Column[];
        totalRows: number;
        totalPages: number;
        currentPage: number;
        pageSize: number | null;
        sortKey: string | null;
        sortDirection: SortDirection;
    };
}
export declare function useTable(initialRows?: TableOptions): TableReturn;
export {};
