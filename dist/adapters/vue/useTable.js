import { reactive } from 'vue';
import { Table } from '../../table';
export function useTable(initialRows = []) {
    const table = Table.create(initialRows);
    const state = reactive({
        data: table.getData(),
        columns: table.getColumns(),
        totalRows: table.getTotalRows(),
        totalPages: table.getTotalPages(),
        currentPage: table.getCurrentPage(),
        pageSize: table.getPageSize(),
        sortKey: table.getSortKey(),
        sortDirection: table.getSortDirection()
    });
    const sync = () => {
        state.data = table.getData();
        state.columns = table.getColumns();
        state.totalRows = table.getTotalRows();
        state.totalPages = table.getTotalPages();
        state.currentPage = table.getCurrentPage();
        state.pageSize = table.getPageSize();
        state.sortKey = table.getSortKey();
        state.sortDirection = table.getSortDirection();
    };
    const setData = (rows) => {
        table.setData(rows);
        sync();
        return table;
    };
    const addColumn = (key, options = {}) => {
        table.addColumn(key, options);
        sync();
        return table;
    };
    const removeColumn = (key) => {
        table.removeColumn(key);
        sync();
        return table;
    };
    const sort = (key, direction = 'asc') => {
        table.sort(key, direction);
        sync();
        return table;
    };
    const filter = (predicate) => {
        table.filter(predicate);
        sync();
        return table;
    };
    const clearFilter = () => {
        table.clearFilter();
        sync();
        return table;
    };
    const paginate = (pageSize) => {
        table.paginate(pageSize);
        sync();
        return table;
    };
    const page = (pageNumber) => {
        table.page(pageNumber);
        sync();
        return table;
    };
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
    };
}
