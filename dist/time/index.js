export class Time {
    date;
    constructor(date = new Date()) {
        if (date instanceof Date) {
            this.date = new Date(date.getTime());
        }
        else if (typeof date === 'string') {
            this.date = new Date(date);
        }
        else {
            this.date = new Date(date);
        }
    }
    static now() {
        return new Time();
    }
    static create(date = new Date()) {
        return new Time(date);
    }
    static parse(str, pattern) {
        // Basic parsing - for complex patterns, use a library
        return new Time(str);
    }
    format(pattern) {
        const d = this.date;
        const tokens = {
            'YYYY': d.getFullYear().toString(),
            'YY': d.getFullYear().toString().slice(-2),
            'MM': String(d.getMonth() + 1).padStart(2, '0'),
            'M': String(d.getMonth() + 1),
            'DD': String(d.getDate()).padStart(2, '0'),
            'D': String(d.getDate()),
            'HH': String(d.getHours()).padStart(2, '0'),
            'H': String(d.getHours()),
            'hh': String(d.getHours() % 12 || 12).padStart(2, '0'),
            'h': String(d.getHours() % 12 || 12),
            'mm': String(d.getMinutes()).padStart(2, '0'),
            'm': String(d.getMinutes()),
            'ss': String(d.getSeconds()).padStart(2, '0'),
            's': String(d.getSeconds()),
            'SSS': String(d.getMilliseconds()).padStart(3, '0'),
            'A': d.getHours() >= 12 ? 'PM' : 'AM',
            'a': d.getHours() >= 12 ? 'pm' : 'am'
        };
        let result = pattern;
        // Sort by length descending to replace longer tokens first
        const sortedKeys = Object.keys(tokens).sort((a, b) => b.length - a.length);
        for (const key of sortedKeys) {
            result = result.replace(new RegExp(key, 'g'), tokens[key]);
        }
        return result;
    }
    toISO() {
        return this.date.toISOString();
    }
    toDate() {
        return new Date(this.date.getTime());
    }
    toTimestamp() {
        return this.date.getTime();
    }
    toUnix() {
        return Math.floor(this.date.getTime() / 1000);
    }
    add(amount, unit) {
        const ms = this.unitToMs(amount, unit);
        return new Time(this.date.getTime() + ms);
    }
    subtract(amount, unit) {
        return this.add(-amount, unit);
    }
    diff(other, unit = 'milliseconds') {
        const otherTime = new Time(other);
        const diffMs = this.date.getTime() - otherTime.date.getTime();
        return this.msToUnit(diffMs, unit);
    }
    isBefore(other) {
        return this.date.getTime() < new Time(other).date.getTime();
    }
    isAfter(other) {
        return this.date.getTime() > new Time(other).date.getTime();
    }
    isSame(other, unit) {
        if (!unit) {
            return this.date.getTime() === new Time(other).date.getTime();
        }
        return this.startOf(unit).date.getTime() === new Time(other).startOf(unit).date.getTime();
    }
    isBetween(start, end) {
        const t = this.date.getTime();
        return t >= new Time(start).date.getTime() && t <= new Time(end).date.getTime();
    }
    startOf(unit) {
        const d = new Date(this.date.getTime());
        switch (unit) {
            case 'years':
                d.setMonth(0, 1);
                d.setHours(0, 0, 0, 0);
                break;
            case 'months':
                d.setDate(1);
                d.setHours(0, 0, 0, 0);
                break;
            case 'weeks':
                d.setDate(d.getDate() - d.getDay());
                d.setHours(0, 0, 0, 0);
                break;
            case 'days':
                d.setHours(0, 0, 0, 0);
                break;
            case 'hours':
                d.setMinutes(0, 0, 0);
                break;
            case 'minutes':
                d.setSeconds(0, 0);
                break;
            case 'seconds':
                d.setMilliseconds(0);
                break;
        }
        return new Time(d);
    }
    endOf(unit) {
        return this.startOf(unit).add(1, unit).subtract(1, 'milliseconds');
    }
    year() {
        return this.date.getFullYear();
    }
    month() {
        return this.date.getMonth() + 1;
    }
    day() {
        return this.date.getDate();
    }
    weekday() {
        return this.date.getDay();
    }
    hour() {
        return this.date.getHours();
    }
    minute() {
        return this.date.getMinutes();
    }
    second() {
        return this.date.getSeconds();
    }
    relative(baseDate) {
        const base = baseDate ? new Time(baseDate).date : new Date();
        const diffMs = base.getTime() - this.date.getTime();
        const absDiff = Math.abs(diffMs);
        const isFuture = diffMs < 0;
        const seconds = Math.floor(absDiff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);
        let value;
        let unit;
        if (years > 0) {
            value = years;
            unit = years === 1 ? 'year' : 'years';
        }
        else if (months > 0) {
            value = months;
            unit = months === 1 ? 'month' : 'months';
        }
        else if (days > 0) {
            value = days;
            unit = days === 1 ? 'day' : 'days';
        }
        else if (hours > 0) {
            value = hours;
            unit = hours === 1 ? 'hour' : 'hours';
        }
        else if (minutes > 0) {
            value = minutes;
            unit = minutes === 1 ? 'minute' : 'minutes';
        }
        else {
            return isFuture ? 'in a moment' : 'just now';
        }
        return isFuture ? `in ${value} ${unit}` : `${value} ${unit} ago`;
    }
    clone() {
        return new Time(this.date);
    }
    unitToMs(amount, unit) {
        switch (unit) {
            case 'milliseconds':
                return amount;
            case 'seconds':
                return amount * 1000;
            case 'minutes':
                return amount * 60 * 1000;
            case 'hours':
                return amount * 60 * 60 * 1000;
            case 'days':
                return amount * 24 * 60 * 60 * 1000;
            case 'weeks':
                return amount * 7 * 24 * 60 * 60 * 1000;
            case 'months':
                return amount * 30 * 24 * 60 * 60 * 1000;
            case 'years':
                return amount * 365 * 24 * 60 * 60 * 1000;
        }
    }
    msToUnit(ms, unit) {
        switch (unit) {
            case 'milliseconds':
                return ms;
            case 'seconds':
                return ms / 1000;
            case 'minutes':
                return ms / (60 * 1000);
            case 'hours':
                return ms / (60 * 60 * 1000);
            case 'days':
                return ms / (24 * 60 * 60 * 1000);
            case 'weeks':
                return ms / (7 * 24 * 60 * 60 * 1000);
            case 'months':
                return ms / (30 * 24 * 60 * 60 * 1000);
            case 'years':
                return ms / (365 * 24 * 60 * 60 * 1000);
        }
    }
}
