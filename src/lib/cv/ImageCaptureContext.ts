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
        // Ensure permission (needed for labels)
        await navigator.mediaDevices.getUserMedia({ video: true });
    
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
    
        const activeTrackIds = new Set<string>();
    
        for (const device of videoDevices) {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: device.deviceId } }
            });
    
            const track = stream.getVideoTracks()[0];
            activeTrackIds.add(track.id);
    
            if (!this._imageCaptureContexts.has(track.id)) {
                this._imageCaptureContexts.set(
                    track.id,
                    new ImageCaptureContext(track)
                );
            }
        }
    
        // Remove stale tracks
        for (const [id] of this._imageCaptureContexts) {
            if (!activeTrackIds.has(id)) {
                this._imageCaptureContexts.delete(id);
            }
        }
    }    
}
