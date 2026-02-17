export class Scale {
    static linear() {
        return new LinearScale();
    }
    static log(base = 10) {
        return new LogScale(base);
    }
    static time() {
        return new TimeScale();
    }
    static band() {
        return new BandScale();
    }
}
class LinearScale {
    _domain = [0, 1];
    _range = [0, 1];
    domain(values) {
        this._domain = values;
        return this;
    }
    range(values) {
        this._range = values;
        return this;
    }
    getDomain() {
        return [...this._domain];
    }
    getRange() {
        return [...this._range];
    }
    value(input) {
        const [d0, d1] = this._domain;
        const [r0, r1] = this._range;
        const ratio = (input - d0) / (d1 - d0);
        return r0 + ratio * (r1 - r0);
    }
    invert(output) {
        const [d0, d1] = this._domain;
        const [r0, r1] = this._range;
        const ratio = (output - r0) / (r1 - r0);
        return d0 + ratio * (d1 - d0);
    }
    ticks(count = 10) {
        const [d0, d1] = this._domain;
        const step = (d1 - d0) / count;
        const ticks = [];
        for (let i = 0; i <= count; i++) {
            ticks.push(d0 + step * i);
        }
        return ticks;
    }
    clamp(enabled = true) {
        // Could implement clamping logic
        return this;
    }
}
class LogScale {
    _domain = [1, 10];
    _range = [0, 1];
    _base;
    constructor(base = 10) {
        this._base = base;
    }
    domain(values) {
        this._domain = values;
        return this;
    }
    range(values) {
        this._range = values;
        return this;
    }
    getDomain() {
        return [...this._domain];
    }
    getRange() {
        return [...this._range];
    }
    value(input) {
        const [d0, d1] = this._domain;
        const [r0, r1] = this._range;
        const logBase = Math.log(this._base);
        const logD0 = Math.log(d0) / logBase;
        const logD1 = Math.log(d1) / logBase;
        const logInput = Math.log(input) / logBase;
        const ratio = (logInput - logD0) / (logD1 - logD0);
        return r0 + ratio * (r1 - r0);
    }
    invert(output) {
        const [d0, d1] = this._domain;
        const [r0, r1] = this._range;
        const logBase = Math.log(this._base);
        const logD0 = Math.log(d0) / logBase;
        const logD1 = Math.log(d1) / logBase;
        const ratio = (output - r0) / (r1 - r0);
        const logValue = logD0 + ratio * (logD1 - logD0);
        return Math.pow(this._base, logValue);
    }
    ticks(count = 10) {
        const [d0, d1] = this._domain;
        const logBase = Math.log(this._base);
        const logD0 = Math.log(d0) / logBase;
        const logD1 = Math.log(d1) / logBase;
        const step = (logD1 - logD0) / count;
        const ticks = [];
        for (let i = 0; i <= count; i++) {
            ticks.push(Math.pow(this._base, logD0 + step * i));
        }
        return ticks;
    }
}
class TimeScale {
    _domain = [new Date(0), new Date()];
    _range = [0, 1];
    domain(values) {
        this._domain = values;
        return this;
    }
    range(values) {
        this._range = values;
        return this;
    }
    getDomain() {
        return [new Date(this._domain[0]), new Date(this._domain[1])];
    }
    getRange() {
        return [...this._range];
    }
    value(input) {
        const [d0, d1] = this._domain;
        const [r0, r1] = this._range;
        const ratio = (input.getTime() - d0.getTime()) / (d1.getTime() - d0.getTime());
        return r0 + ratio * (r1 - r0);
    }
    invert(output) {
        const [d0, d1] = this._domain;
        const [r0, r1] = this._range;
        const ratio = (output - r0) / (r1 - r0);
        const time = d0.getTime() + ratio * (d1.getTime() - d0.getTime());
        return new Date(time);
    }
    ticks(count = 10) {
        const [d0, d1] = this._domain;
        const step = (d1.getTime() - d0.getTime()) / count;
        const ticks = [];
        for (let i = 0; i <= count; i++) {
            ticks.push(new Date(d0.getTime() + step * i));
        }
        return ticks;
    }
}
class BandScale {
    _domain = [];
    _range = [0, 1];
    _padding = 0.1;
    domain(values) {
        this._domain = values;
        return this;
    }
    range(values) {
        this._range = values;
        return this;
    }
    padding(value) {
        this._padding = value;
        return this;
    }
    getDomain() {
        return [...this._domain];
    }
    getRange() {
        return [...this._range];
    }
    value(input) {
        const index = this._domain.indexOf(input);
        if (index === -1)
            return 0;
        const [r0, r1] = this._range;
        const totalWidth = r1 - r0;
        const bandCount = this._domain.length;
        const paddingWidth = totalWidth * this._padding;
        const bandWidth = (totalWidth - paddingWidth) / bandCount;
        const step = totalWidth / bandCount;
        return r0 + step * index + (step - bandWidth) / 2;
    }
    bandwidth() {
        const [r0, r1] = this._range;
        const totalWidth = r1 - r0;
        const bandCount = this._domain.length || 1;
        const paddingWidth = totalWidth * this._padding;
        return (totalWidth - paddingWidth) / bandCount;
    }
    ticks() {
        return [...this._domain];
    }
    invert(output) {
        const [r0, r1] = this._range;
        const step = (r1 - r0) / this._domain.length;
        const index = Math.floor((output - r0) / step);
        return this._domain[Math.max(0, Math.min(index, this._domain.length - 1))];
    }
}
