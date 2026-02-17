export class Clipboard {
    constructor() { }
    static async copy(text) {
        if (!navigator?.clipboard) {
            return Clipboard.fallbackCopy(text);
        }
        try {
            await navigator.clipboard.writeText(text);
            return true;
        }
        catch {
            return Clipboard.fallbackCopy(text);
        }
    }
    static async paste() {
        if (!navigator?.clipboard) {
            return null;
        }
        try {
            return await navigator.clipboard.readText();
        }
        catch {
            return null;
        }
    }
    static async copyImage(blob) {
        if (!navigator?.clipboard?.write) {
            return false;
        }
        try {
            const item = new ClipboardItem({ [blob.type]: blob });
            await navigator.clipboard.write([item]);
            return true;
        }
        catch {
            return false;
        }
    }
    static async copyHtml(html, plainText) {
        if (!navigator?.clipboard?.write) {
            return Clipboard.copy(plainText || html);
        }
        try {
            const items = {
                'text/html': new Blob([html], { type: 'text/html' })
            };
            if (plainText) {
                items['text/plain'] = new Blob([plainText], { type: 'text/plain' });
            }
            await navigator.clipboard.write([new ClipboardItem(items)]);
            return true;
        }
        catch {
            return Clipboard.copy(plainText || html);
        }
    }
    static isSupported() {
        return typeof navigator !== 'undefined' && !!navigator.clipboard;
    }
    static isWriteSupported() {
        return typeof navigator !== 'undefined' && !!navigator.clipboard?.write;
    }
    static fallbackCopy(text) {
        if (typeof document === 'undefined')
            return false;
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            return true;
        }
        catch {
            return false;
        }
        finally {
            document.body.removeChild(textarea);
        }
    }
}
