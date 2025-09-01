// This script is injected at document_start into the MAIN world.

console.log('[Hotaudio Downloader] Hijack script loaded. Version 3.');

// --- Part 1: Intercept the audio data chunks. This part is solid and remains. ---

const originalAppendBuffer = SourceBuffer.prototype.appendBuffer;
SourceBuffer.prototype.appendBuffer = function(data) {
    if (!window.DECRYPTED_AUDIO_CHUNKS) {
        window.DECRYPTED_AUDIO_CHUNKS = [];
    }
    window.DECRYPTED_AUDIO_CHUNKS.push(data);
    return originalAppendBuffer.apply(this, arguments);
};

// --- Part 2: Find and wrap the AudioSource class using rapid polling. ---

const hijackInterval = setInterval(() => {
    // Check if the site's script has defined the class on the window object.
    if (typeof window.AudioSource === 'function') {

        // It exists! We can stop polling now.
        clearInterval(hijackInterval);

        console.log('[Hotaudio Downloader] Found AudioSource class. Applying wrapper...');

        // Keep a reference to the original class.
        const OriginalAudioSource = window.AudioSource;

        // Overwrite the global AudioSource with our wrapper function.
        window.AudioSource = function(...args) {
            // The site calls `new AudioSource()`, which now runs our code.
            const instance = new OriginalAudioSource(...args);
            console.log('[Hotaudio Downloader] AudioSource instance captured!');

            // The critical step: assign the instance so main_world.js can find it.
            window.as = instance;

            return instance;
        };

        console.log('[Hotaudio Downloader] Hijack complete. Ready for download command.');
    }
}, 10);

setTimeout(() => {
    clearInterval(hijackInterval);
}, 10000);