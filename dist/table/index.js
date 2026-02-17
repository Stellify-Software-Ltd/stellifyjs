export class Table {
    rows;
    originalRows;
    columns;
    sortKey;
    sortDirection;
    filterPredicate;
    pageSize;
    currentPage;
    constructor(rows = []) {
        this.rows = [...rows];
        this.originalRows = [...rows];
        this.columns = [];
        this.sortKey = null;
        this.sortDirection = 'asc';
        this.filterPredicate = null;
        this.pageSize = null;
        this.currentPage = 1;
    }
    static create(rows = []) {
        return new Table(rows);
    }
    setData(rows) {
        this.rows = [...rows];
        this.originalRows = [...rows];
        this.applyTransforms();
        return this;
    }
    addColumn(key, options = {}) {
        this.columns.push({ key, options });
        return this;
    }
    removeColumn(key) {
        this.columns = this.columns.filter(c => c.key !== key);
        return this;
    }
    sort(key, direction = 'asc') {
        this.sortKey = key;
        this.sortDirection = direction;
        this.applyTransforms();
        return this;
    }
    filter(predicate) {
        this.filterPredicate = predicate;
        this.applyTransforms();
        return this;
    }
    clearFilter() {
        this.filterPredicate = null;
        this.applyTransforms();
        return this;
    }
    paginate(pageSize) {
        this.pageSize = pageSize;
        this.currentPage = 1;
        return this;
    }
    page(pageNumber) {
        this.currentPage = pageNumber;
        return this;
    }
    applyTransforms() {
        let result = [...this.originalRows];
        if (this.filterPredicate) {
            result = result.filter(this.filterPredicate);
        }
        if (this.sortKey) {
            const key = this.sortKey;
            const dir = this.sortDirection === 'asc' ? 1 : -1;
            result.sort((a, b) => {
                const aVal = a[key];
                const bVal = b[key];
                if (aVal < bVal)
                    return -1 * dir;
                if (aVal > bVal)
                    return 1 * dir;
                return 0;
            });
        }
        this.rows = result;
    }
    getData() {
        if (this.pageSize) {
            const start = (this.currentPage - 1) * this.pageSize;
            return this.rows.slice(start, start + this.pageSize);
        }
        return [...this.rows];
    }
    getAllData() {
        return [...this.rows];
    }
    getColumns() {
        return [...this.columns];
    }
    getColumn(key) {
        return this.columns.find(c => c.key === key) || null;
    }
    getTotalRows() {
        return this.rows.length;
    }
    getTotalPages() {
        if (!this.pageSize)
            return 1;
        return Math.ceil(this.rows.length / this.pageSize);
    }
    getCurrentPage() {
        return this.currentPage;
    }
    getPageSize() {
        return this.pageSize;
    }
    getSortKey() {
        return this.sortKey;
    }
    getSortDirection() {
        return this.sortDirection;
    }
}
