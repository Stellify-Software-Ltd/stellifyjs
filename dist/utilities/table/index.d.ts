type Row = Record<string, unknown>;
type SortDirection = 'asc' | 'desc';
type FilterPredicate = (row: Row) => boolean;
type ColumnOptions = {
    label?: string;
    sortable?: boolean;
    formatter?: (value: unknown) => string;
};
export interface Column {
    key: string;
    options: ColumnOptions;
}
export declare class Table {
    private rows;
    private originalRows;
    private columns;
    private sortKey;
    private sortDirection;
    private filterPredicate;
    private pageSize;
    private currentPage;
    private constructor();
    static create(rows?: Row[]): Table;
    setData(rows: Row[]): Table;
    addColumn(key: string, options?: ColumnOptions): Table;
    removeColumn(key: string): Table;
    sort(key: string, direction?: SortDirection): Table;
    filter(predicate: FilterPredicate): Table;
    clearFilter(): Table;
    paginate(pageSize: number): Table;
    page(pageNumber: number): Table;
    private applyTransforms;
    getData(): Row[];
    getAllData(): Row[];
    getColumns(): Column[];
    getColumn(key: string): Column | null;
    getTotalRows(): number;
    getTotalPages(): number;
    getCurrentPage(): number;
    getPageSize(): number | null;
    getSortKey(): string | null;
    getSortDirection(): SortDirection;
}
export {};
