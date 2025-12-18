export class ImageCaptureContext {
    private static _imageCaptureContexts: Map<string, ImageCaptureContext> = new Map();
    private static _initialized: boolean = false;

    public static get imageCaptureContexts(): Map<string, ImageCaptureContext> {
        if (!ImageCaptureContext._initialized) {
            throw new Error('ImageCaptureContext not initialized. Call ImageCaptureContext.initialize() first.');
        }
        return ImageCaptureContext._imageCaptureContexts;
    }

    public imageCapture: ImageCapture;
    constructor(public mediaStreamTrack: MediaStreamTrack) {
        this.imageCapture = new ImageCapture(mediaStreamTrack);
    }

    static async initialize(): Promise<void> {
        await this.refreshVideoTracks();
        this._initialized = true;
    }

    static async refreshVideoTracks(): Promise<void> {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTracks = mediaStream.getVideoTracks();
        for (const track of videoTracks) {
            if (!this._imageCaptureContexts.has(track.id)) {
                const context = new ImageCaptureContext(track);
                this._imageCaptureContexts.set(track.id, context);
            }
        }
        for (const [id] of this._imageCaptureContexts) {
            if (!videoTracks.find(track => track.id === id)) {
                this._imageCaptureContexts.delete(id);
            }
        }
    }
}
