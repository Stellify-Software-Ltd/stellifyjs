import { Table } from '../../table';
type Row = Record<string, unknown>;
type SortDirection = 'asc' | 'desc';
type FilterPredicate = (row: Row) => boolean;
type ColumnOptions = {
    label?: string;
    sortable?: boolean;
    formatter?: (value: unknown) => string;
};
export declare function useTable(initialRows?: Row[]): {
    setData: (rows: Row[]) => Table;
    addColumn: (key: string, options?: ColumnOptions) => Table;
    removeColumn: (key: string) => Table;
    sort: (key: string, direction?: SortDirection) => Table;
    filter: (predicate: FilterPredicate) => Table;
    clearFilter: () => Table;
    paginate: (pageSize: number) => Table;
    page: (pageNumber: number) => Table;
    getData: () => {
        [x: string]: unknown;
    }[];
    getAllData: () => {
        [x: string]: unknown;
    }[];
    getColumns: () => import("../../table").Column[];
    getColumn: (key: string) => import("../../table").Column | null;
    getTotalRows: () => number;
    getTotalPages: () => number;
    getCurrentPage: () => number;
    getPageSize: () => number | null;
    getSortKey: () => string | null;
    getSortDirection: () => "asc" | "desc";
};
export {};
