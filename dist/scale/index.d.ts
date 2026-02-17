interface BaseScale {
    value(input: number | Date | string): number;
    invert(output: number): number | Date | string;
    ticks(count?: number): Array<number | Date | string>;
    domain(values: [number | Date | string, number | Date | string]): this;
    range(values: [number, number]): this;
    getDomain(): [number | Date | string, number | Date | string];
    getRange(): [number, number];
}
export declare class Scale {
    static linear(): LinearScale;
    static log(base?: number): LogScale;
    static time(): TimeScale;
    static band(): BandScale;
}
declare class LinearScale implements BaseScale {
    private _domain;
    private _range;
    domain(values: [number, number]): this;
    range(values: [number, number]): this;
    getDomain(): [number, number];
    getRange(): [number, number];
    value(input: number): number;
    invert(output: number): number;
    ticks(count?: number): number[];
    clamp(enabled?: boolean): this;
}
declare class LogScale implements BaseScale {
    private _domain;
    private _range;
    private _base;
    constructor(base?: number);
    domain(values: [number, number]): this;
    range(values: [number, number]): this;
    getDomain(): [number, number];
    getRange(): [number, number];
    value(input: number): number;
    invert(output: number): number;
    ticks(count?: number): number[];
}
declare class TimeScale implements BaseScale {
    private _domain;
    private _range;
    domain(values: [Date, Date]): this;
    range(values: [number, number]): this;
    getDomain(): [Date, Date];
    getRange(): [number, number];
    value(input: Date): number;
    invert(output: number): Date;
    ticks(count?: number): Date[];
}
declare class BandScale {
    private _domain;
    private _range;
    private _padding;
    domain(values: string[]): this;
    range(values: [number, number]): this;
    padding(value: number): this;
    getDomain(): string[];
    getRange(): [number, number];
    value(input: string): number;
    bandwidth(): number;
    ticks(): string[];
    invert(output: number): string;
}
export {};
