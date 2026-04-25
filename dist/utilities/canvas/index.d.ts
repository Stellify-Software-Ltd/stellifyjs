interface DrawStyle {
    fill?: string;
    stroke?: string;
    lineWidth?: number;
    lineCap?: CanvasLineCap;
    lineJoin?: CanvasLineJoin;
    globalAlpha?: number;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
}
interface TextStyle extends DrawStyle {
    font?: string;
    textAlign?: CanvasTextAlign;
    textBaseline?: CanvasTextBaseline;
}
export declare class Canvas {
    private canvas;
    private ctx;
    private stateStack;
    private constructor();
    static create(width?: number, height?: number): Canvas;
    static fromElement(element: HTMLCanvasElement): Canvas;
    static fromSelector(selector: string): Canvas;
    size(width: number, height: number): this;
    getWidth(): number;
    getHeight(): number;
    style(style: DrawStyle): this;
    save(): this;
    restore(): this;
    clear(): this;
    fill(color: string): this;
    rect(x: number, y: number, width: number, height: number, style?: DrawStyle): this;
    circle(cx: number, cy: number, radius: number, style?: DrawStyle): this;
    ellipse(cx: number, cy: number, rx: number, ry: number, style?: DrawStyle): this;
    line(x1: number, y1: number, x2: number, y2: number, style?: DrawStyle): this;
    polyline(points: Array<[number, number]>, style?: DrawStyle): this;
    polygon(points: Array<[number, number]>, style?: DrawStyle): this;
    arc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, style?: DrawStyle): this;
    path(d: string, style?: DrawStyle): this;
    text(text: string, x: number, y: number, style?: TextStyle): this;
    measureText(text: string, font?: string): TextMetrics;
    drawImage(source: string | HTMLImageElement, x: number, y: number, width?: number, height?: number): Promise<this>;
    private loadImage;
    translate(x: number, y: number): this;
    rotate(angle: number): this;
    scale(x: number, y: number): this;
    resetTransform(): this;
    getPixel(x: number, y: number): [number, number, number, number];
    setPixel(x: number, y: number, r: number, g: number, b: number, a?: number): this;
    getImageData(x?: number, y?: number, width?: number, height?: number): ImageData;
    putImageData(imageData: ImageData, x?: number, y?: number): this;
    toDataURL(type?: string, quality?: number): string;
    toBlob(type?: string, quality?: number): Promise<Blob | null>;
    getElement(): HTMLCanvasElement;
    getContext(): CanvasRenderingContext2D;
    appendTo(parent: HTMLElement | string): this;
}
export declare class CanvasError extends Error {
    constructor(message: string);
}
export {};
