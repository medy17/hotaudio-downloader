// This script is injected at document_start into the MAIN world.

console.log('[Hotaudio Downloader] Hijack script loaded. Version 4.');

const originalAppendBuffer = SourceBuffer.prototype.appendBuffer;
SourceBuffer.prototype.appendBuffer = function(data) {
    if (!window.DECRYPTED_AUDIO_CHUNKS) {
        window.DECRYPTED_AUDIO_CHUNKS = [];
    }
    window.DECRYPTED_AUDIO_CHUNKS.push(data);
    return originalAppendBuffer.apply(this, arguments);
};

const hijackInterval = setInterval(() => {
    if (typeof window.AudioSource === 'function') {
        clearInterval(hijackInterval);
        console.log('[Hotaudio Downloader] Found AudioSource class. Applying wrapper...');
        const OriginalAudioSource = window.AudioSource;
        window.AudioSource = function(...args) {
            const instance = new OriginalAudioSource(...args);
            console.log('[Hotaudio Downloader] AudioSource instance captured!');
            window.as = instance;

            // Signal to the extension that the player is ready
            window.postMessage({ type: "HOTAUDIO_PLAYER_READY" }, "*");

            return instance;
        };
        console.log('[Hotaudio Downloader] Hijack complete. Ready for download command.');
    }
}, 10);

setTimeout(() => {
    clearInterval(hijackInterval);
}, 10000);