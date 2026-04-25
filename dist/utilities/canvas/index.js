export class Canvas {
    canvas;
    ctx;
    stateStack = [];
    constructor(canvas) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new CanvasError('Could not get 2D context');
        }
        this.ctx = ctx;
    }
    static create(width = 400, height = 300) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return new Canvas(canvas);
    }
    static fromElement(element) {
        return new Canvas(element);
    }
    static fromSelector(selector) {
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLCanvasElement)) {
            throw new CanvasError(`Element not found or not a canvas: ${selector}`);
        }
        return new Canvas(element);
    }
    // Sizing
    size(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        return this;
    }
    getWidth() {
        return this.canvas.width;
    }
    getHeight() {
        return this.canvas.height;
    }
    // Style management
    style(style) {
        if (style.fill)
            this.ctx.fillStyle = style.fill;
        if (style.stroke)
            this.ctx.strokeStyle = style.stroke;
        if (style.lineWidth)
            this.ctx.lineWidth = style.lineWidth;
        if (style.lineCap)
            this.ctx.lineCap = style.lineCap;
        if (style.lineJoin)
            this.ctx.lineJoin = style.lineJoin;
        if (style.globalAlpha !== undefined)
            this.ctx.globalAlpha = style.globalAlpha;
        if (style.shadowColor)
            this.ctx.shadowColor = style.shadowColor;
        if (style.shadowBlur !== undefined)
            this.ctx.shadowBlur = style.shadowBlur;
        if (style.shadowOffsetX !== undefined)
            this.ctx.shadowOffsetX = style.shadowOffsetX;
        if (style.shadowOffsetY !== undefined)
            this.ctx.shadowOffsetY = style.shadowOffsetY;
        return this;
    }
    save() {
        this.ctx.save();
        return this;
    }
    restore() {
        this.ctx.restore();
        return this;
    }
    // Drawing primitives
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        return this;
    }
    fill(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        return this;
    }
    rect(x, y, width, height, style) {
        if (style)
            this.style(style);
        if (style?.fill)
            this.ctx.fillRect(x, y, width, height);
        if (style?.stroke)
            this.ctx.strokeRect(x, y, width, height);
        if (!style?.fill && !style?.stroke)
            this.ctx.fillRect(x, y, width, height);
        return this;
    }
    circle(cx, cy, radius, style) {
        if (style)
            this.style(style);
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        if (style?.fill !== undefined)
            this.ctx.fill();
        if (style?.stroke)
            this.ctx.stroke();
        if (!style?.fill && !style?.stroke)
            this.ctx.fill();
        return this;
    }
    ellipse(cx, cy, rx, ry, style) {
        if (style)
            this.style(style);
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        if (style?.fill !== undefined)
            this.ctx.fill();
        if (style?.stroke)
            this.ctx.stroke();
        if (!style?.fill && !style?.stroke)
            this.ctx.fill();
        return this;
    }
    line(x1, y1, x2, y2, style) {
        if (style)
            this.style(style);
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        return this;
    }
    polyline(points, style) {
        if (points.length < 2)
            return this;
        if (style)
            this.style(style);
        this.ctx.beginPath();
        this.ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i][0], points[i][1]);
        }
        this.ctx.stroke();
        return this;
    }
    polygon(points, style) {
        if (points.length < 3)
            return this;
        if (style)
            this.style(style);
        this.ctx.beginPath();
        this.ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i][0], points[i][1]);
        }
        this.ctx.closePath();
        if (style?.fill !== undefined)
            this.ctx.fill();
        if (style?.stroke)
            this.ctx.stroke();
        if (!style?.fill && !style?.stroke)
            this.ctx.fill();
        return this;
    }
    arc(cx, cy, radius, startAngle, endAngle, style) {
        if (style)
            this.style(style);
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, startAngle, endAngle);
        if (style?.fill)
            this.ctx.fill();
        this.ctx.stroke();
        return this;
    }
    path(d, style) {
        if (style)
            this.style(style);
        const path = new Path2D(d);
        if (style?.fill !== undefined)
            this.ctx.fill(path);
        if (style?.stroke)
            this.ctx.stroke(path);
        if (!style?.fill && !style?.stroke)
            this.ctx.fill(path);
        return this;
    }
    // Text
    text(text, x, y, style) {
        if (style) {
            this.style(style);
            if (style.font)
                this.ctx.font = style.font;
            if (style.textAlign)
                this.ctx.textAlign = style.textAlign;
            if (style.textBaseline)
                this.ctx.textBaseline = style.textBaseline;
        }
        if (style?.stroke) {
            this.ctx.strokeText(text, x, y);
        }
        this.ctx.fillText(text, x, y);
        return this;
    }
    measureText(text, font) {
        if (font)
            this.ctx.font = font;
        return this.ctx.measureText(text);
    }
    // Images
    async drawImage(source, x, y, width, height) {
        const img = typeof source === 'string' ? await this.loadImage(source) : source;
        if (width !== undefined && height !== undefined) {
            this.ctx.drawImage(img, x, y, width, height);
        }
        else {
            this.ctx.drawImage(img, x, y);
        }
        return this;
    }
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new CanvasError(`Failed to load image: ${src}`));
            img.src = src;
        });
    }
    // Transformations
    translate(x, y) {
        this.ctx.translate(x, y);
        return this;
    }
    rotate(angle) {
        this.ctx.rotate(angle);
        return this;
    }
    scale(x, y) {
        this.ctx.scale(x, y);
        return this;
    }
    resetTransform() {
        this.ctx.resetTransform();
        return this;
    }
    // Pixel manipulation
    getPixel(x, y) {
        const data = this.ctx.getImageData(x, y, 1, 1).data;
        return [data[0], data[1], data[2], data[3]];
    }
    setPixel(x, y, r, g, b, a = 255) {
        const imageData = this.ctx.createImageData(1, 1);
        imageData.data[0] = r;
        imageData.data[1] = g;
        imageData.data[2] = b;
        imageData.data[3] = a;
        this.ctx.putImageData(imageData, x, y);
        return this;
    }
    getImageData(x, y, width, height) {
        return this.ctx.getImageData(x ?? 0, y ?? 0, width ?? this.canvas.width, height ?? this.canvas.height);
    }
    putImageData(imageData, x = 0, y = 0) {
        this.ctx.putImageData(imageData, x, y);
        return this;
    }
    // Export
    toDataURL(type = 'image/png', quality) {
        return this.canvas.toDataURL(type, quality);
    }
    toBlob(type = 'image/png', quality) {
        return new Promise(resolve => {
            this.canvas.toBlob(resolve, type, quality);
        });
    }
    getElement() {
        return this.canvas;
    }
    getContext() {
        return this.ctx;
    }
    // Append to DOM
    appendTo(parent) {
        const target = typeof parent === 'string'
            ? document.querySelector(parent)
            : parent;
        if (!target) {
            throw new CanvasError('Parent element not found');
        }
        target.appendChild(this.canvas);
        return this;
    }
}
export class CanvasError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CanvasError';
    }
}
