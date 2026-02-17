type Orientation = 'top' | 'bottom' | 'left' | 'right';
interface Tick {
    value: number | string | Date;
    position: number;
    label: string;
}
interface ScaleLike {
    value(input: unknown): number;
    ticks(count?: number): Array<number | string | Date>;
    getRange(): [number, number];
}
export declare class Axis {
    private scale;
    private config;
    private constructor();
    static create(scale: ScaleLike): Axis;
    orientation(value: Orientation): Axis;
    ticks(count: number): Axis;
    tickFormat(formatter: (value: number | string | Date) => string): Axis;
    tickSize(size: number): Axis;
    getTicks(): Tick[];
    getOrientation(): Orientation;
    getTickSize(): number;
    getRange(): [number, number];
    isHorizontal(): boolean;
    isVertical(): boolean;
}
export {};
