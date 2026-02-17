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
    state: {
        data: {
            [x: string]: unknown;
        }[];
        columns: {
            key: string;
            options: {
                label?: string | undefined;
                sortable?: boolean | undefined;
                formatter?: ((value: unknown) => string) | undefined;
            };
        }[];
        totalRows: number;
        totalPages: number;
        currentPage: number;
        pageSize: number | null;
        sortKey: string | null;
        sortDirection: "asc" | "desc";
    };
};
export {};
