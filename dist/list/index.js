export class List {
    items;
    constructor(items = []) {
        this.items = [...items];
    }
    static create(items = []) {
        return new List(items);
    }
    static from(items) {
        return new List(Array.from(items));
    }
    static range(start, end, step = 1) {
        const items = [];
        for (let i = start; i < end; i += step) {
            items.push(i);
        }
        return new List(items);
    }
    add(item, index) {
        if (index !== undefined) {
            this.items.splice(index, 0, item);
        }
        else {
            this.items.push(item);
        }
        return this;
    }
    remove(index) {
        this.items.splice(index, 1);
        return this;
    }
    removeWhere(predicate) {
        this.items = this.items.filter((item, i) => !predicate(item, i));
        return this;
    }
    set(index, item) {
        if (index >= 0 && index < this.items.length) {
            this.items[index] = item;
        }
        return this;
    }
    get(index) {
        return this.items[index];
    }
    first() {
        return this.items[0];
    }
    last() {
        return this.items[this.items.length - 1];
    }
    sort(comparator) {
        this.items.sort(comparator);
        return this;
    }
    sortBy(key, direction = 'asc') {
        const dir = direction === 'asc' ? 1 : -1;
        this.items.sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            if (aVal < bVal)
                return -1 * dir;
            if (aVal > bVal)
                return 1 * dir;
            return 0;
        });
        return this;
    }
    reverse() {
        this.items.reverse();
        return this;
    }
    filter(predicate) {
        return new List(this.items.filter(predicate));
    }
    find(predicate) {
        return this.items.find((item, i) => predicate(item, i));
    }
    findIndex(predicate) {
        return this.items.findIndex((item, i) => predicate(item, i));
    }
    map(mapper) {
        return new List(this.items.map(mapper));
    }
    reduce(reducer, initial) {
        return this.items.reduce(reducer, initial);
    }
    forEach(callback) {
        this.items.forEach(callback);
        return this;
    }
    includes(item) {
        return this.items.includes(item);
    }
    indexOf(item) {
        return this.items.indexOf(item);
    }
    every(predicate) {
        return this.items.every(predicate);
    }
    some(predicate) {
        return this.items.some(predicate);
    }
    slice(start, end) {
        return new List(this.items.slice(start, end));
    }
    take(count) {
        return new List(this.items.slice(0, count));
    }
    skip(count) {
        return new List(this.items.slice(count));
    }
    chunk(size) {
        const chunks = [];
        for (let i = 0; i < this.items.length; i += size) {
            chunks.push(this.items.slice(i, i + size));
        }
        return new List(chunks);
    }
    unique() {
        return new List([...new Set(this.items)]);
    }
    uniqueBy(key) {
        const seen = new Set();
        const result = [];
        for (const item of this.items) {
            const val = item[key];
            if (!seen.has(val)) {
                seen.add(val);
                result.push(item);
            }
        }
        return new List(result);
    }
    groupBy(key) {
        const groups = new Map();
        for (const item of this.items) {
            const val = item[key];
            if (!groups.has(val)) {
                groups.set(val, []);
            }
            groups.get(val).push(item);
        }
        return groups;
    }
    flatten() {
        return new List(this.items.flat());
    }
    concat(...lists) {
        const all = [...this.items];
        for (const list of lists) {
            all.push(...list.toArray());
        }
        return new List(all);
    }
    isEmpty() {
        return this.items.length === 0;
    }
    isNotEmpty() {
        return this.items.length > 0;
    }
    count() {
        return this.items.length;
    }
    clear() {
        this.items = [];
        return this;
    }
    toArray() {
        return [...this.items];
    }
    toJSON() {
        return this.toArray();
    }
    clone() {
        return new List([...this.items]);
    }
    // Numeric operations (when T is number)
    sum() {
        return this.items.reduce((a, b) => a + b, 0);
    }
    avg() {
        if (this.items.length === 0)
            return 0;
        return this.sum() / this.items.length;
    }
    min() {
        if (this.items.length === 0)
            return undefined;
        return this.items.reduce((min, item) => item < min ? item : min);
    }
    max() {
        if (this.items.length === 0)
            return undefined;
        return this.items.reduce((max, item) => item > max ? item : max);
    }
}
