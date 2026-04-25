export class Axis {
    scale;
    config;
    constructor(scale) {
        this.scale = scale;
        this.config = {
            orientation: 'bottom',
            tickCount: 10,
            tickFormat: (v) => String(v),
            tickSize: 6
        };
    }
    static create(scale) {
        return new Axis(scale);
    }
    orientation(value) {
        this.config.orientation = value;
        return this;
    }
    ticks(count) {
        this.config.tickCount = count;
        return this;
    }
    tickFormat(formatter) {
        this.config.tickFormat = formatter;
        return this;
    }
    tickSize(size) {
        this.config.tickSize = size;
        return this;
    }
    getTicks() {
        const tickValues = this.scale.ticks(this.config.tickCount);
        return tickValues.map(value => ({
            value,
            position: this.scale.value(value),
            label: this.config.tickFormat(value)
        }));
    }
    getOrientation() {
        return this.config.orientation;
    }
    getTickSize() {
        return this.config.tickSize;
    }
    getRange() {
        return this.scale.getRange();
    }
    isHorizontal() {
        return this.config.orientation === 'top' || this.config.orientation === 'bottom';
    }
    isVertical() {
        return this.config.orientation === 'left' || this.config.orientation === 'right';
    }
}
