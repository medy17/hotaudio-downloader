// --- PASTE THIS ENTIRE BLOCK AT THE VERY TOP OF NOZZLE.JS ---

// 1. Prepare a place to store the decrypted audio chunks
window.DECRYPTED_AUDIO_CHUNKS = [];
console.log('[HIJACK] Audio chunk collector is ready.');

// 2. Hijack the function that receives the decrypted audio
const originalAppendBuffer = SourceBuffer.prototype.appendBuffer;
SourceBuffer.prototype.appendBuffer = function(data) {
    // 3. Secretly save a copy of the clean data
    window.DECRYPTED_AUDIO_CHUNKS.push(data);
    console.log(`[HIJACK] Captured a decrypted chunk! Size: ${data.byteLength} bytes. Total chunks: ${window.DECRYPTED_AUDIO_CHUNKS.length}`);

    // 4. Call the original function so the audio still plays
    return originalAppendBuffer.apply(this, arguments);
};

// --- END OF HIJACK BLOCK ---