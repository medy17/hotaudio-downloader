// --- PASTE THIS EXPORTER SCRIPT INTO THE CONSOLE ---

if (window.DECRYPTED_AUDIO_CHUNKS && window.DECRYPTED_AUDIO_CHUNKS.length > 0) {
    console.log("Stitching chunks together...");
    // The codec is AAC, which is stored in an M4A container
    const mimeType = 'audio/mp4';
    const blob = new Blob(window.DECRYPTED_AUDIO_CHUNKS, {type: mimeType});

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'decrypted_audio.m4a'; // Set the filename
    document.body.appendChild(a);

    console.log("Triggering download...");
    a.click();

    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        console.log("Download complete. You can now find 'decrypted_audio.m4a' in your downloads folder.");
    }, 100);

} else {
    console.error("Error: No decrypted audio chunks were found. Did you play the entire track?");
}

// --- END OF EXPORTER SCRIPT ---