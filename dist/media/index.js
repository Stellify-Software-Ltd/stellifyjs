export class Media {
    constructor() { }
    static async selectFile(options = {}) {
        const files = await Media.selectFiles({ ...options, multiple: false });
        return files[0] || null;
    }
    static async selectFiles(options = {}) {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = options.accept || '*/*';
            input.multiple = options.multiple || false;
            input.onchange = () => {
                const files = input.files ? Array.from(input.files) : [];
                resolve(files);
            };
            input.oncancel = () => {
                resolve([]);
            };
            input.click();
        });
    }
    static async capture(type, options = {}) {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new MediaError('getUserMedia is not supported');
        }
        const constraints = {};
        if (type === 'photo' || type === 'video') {
            constraints.video = options.video ?? true;
        }
        if (type === 'video' || type === 'audio') {
            constraints.audio = options.audio ?? true;
        }
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (type === 'photo') {
            return Media.capturePhoto(stream);
        }
        else if (type === 'video' || type === 'audio') {
            return Media.captureRecording(stream, type);
        }
        return null;
    }
    static async capturePhoto(stream) {
        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        stream.getTracks().forEach(track => track.stop());
        return new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', 0.9);
        });
    }
    static captureRecording(stream, type) {
        return new Promise((resolve, reject) => {
            const mimeType = type === 'video' ? 'video/webm' : 'audio/webm';
            const recorder = new MediaRecorder(stream, { mimeType });
            const chunks = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };
            recorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                resolve(new Blob(chunks, { type: mimeType }));
            };
            recorder.onerror = () => {
                stream.getTracks().forEach(track => track.stop());
                reject(new MediaError('Recording failed'));
            };
            // Auto-stop after 60 seconds max
            setTimeout(() => recorder.stop(), 60000);
            recorder.start();
        });
    }
    static getMetadata(file) {
        return {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
        };
    }
    static async resize(file, options = {}) {
        const { width, height, quality = 0.9, type = 'image/jpeg' } = options;
        const img = await Media.loadImage(file);
        let targetWidth = width || img.width;
        let targetHeight = height || img.height;
        // Maintain aspect ratio if only one dimension provided
        if (width && !height) {
            targetHeight = (img.height / img.width) * width;
        }
        else if (height && !width) {
            targetWidth = (img.width / img.height) * height;
        }
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, targetWidth, targetHeight);
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => blob ? resolve(blob) : reject(new MediaError('Resize failed')), type, quality);
        });
    }
    static async toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new MediaError('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }
    static async toArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new MediaError('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }
    static async toText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new MediaError('Failed to read file'));
            reader.readAsText(file);
        });
    }
    static formatSize(bytes) {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    static isImage(file) {
        return file.type.startsWith('image/');
    }
    static isVideo(file) {
        return file.type.startsWith('video/');
    }
    static isAudio(file) {
        return file.type.startsWith('audio/');
    }
    static loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new MediaError('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }
}
export class MediaError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MediaError';
    }
}
