// This file is injected and run in the page's MAIN world.

// Function to send status updates back to the extension's content script
function updateStatus(message) {
    window.postMessage({ type: "HOTAUDIO_DOWNLOAD_STATUS", message: message }, "*");
}

function automate() {
    const audioSource = window.as;
    if (!audioSource || !audioSource.el) {
        updateStatus("Error: Player not found!");
        console.error("Injected script could not find window.as");
        return;
    }

    const audioElement = audioSource.el;
    let downloadTriggered = false; // Flag to ensure download happens only once

    const triggerDownload = () => {
        if (downloadTriggered) return; // Prevent multiple triggers
        downloadTriggered = true;

        // Clear our watchdog listener to prevent it from re-firing
        audioElement.removeEventListener('timeupdate', stallWatcher);

        if (window.DECRYPTED_AUDIO_CHUNKS && window.DECRYPTED_AUDIO_CHUNKS.length > 0) {
            updateStatus("Stitching audio chunks...");
            console.log("Stitching chunks together...");

            const mimeType = 'audio/mp4';
            const blob = new Blob(window.DECRYPTED_AUDIO_CHUNKS, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;

            let filename = document.title.replace(' - Hotaudio', '').trim().replace(/[\\/:"*?<>|]/g, '_') || 'decrypted_audio';
            a.download = `${filename}.m4a`;

            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                updateStatus("Download complete!");
                console.log("Download process finished.");
            }, 300);
        } else {
            updateStatus("Error: No audio data captured!");
            console.error("Error: No decrypted audio chunks were found.");
        }
    };

    // --- NEW STALL DETECTION LOGIC ---
    let stallTimerId = null;
    let lastKnownChunkCount = 0;

    const stallWatcher = () => {
        if (downloadTriggered) return;

        // Check if new chunks have been added. If so, reset the stall timer.
        const currentChunkCount = window.DECRYPTED_AUDIO_CHUNKS ? window.DECRYPTED_AUDIO_CHUNKS.length : 0;
        if (currentChunkCount > lastKnownChunkCount) {
            lastKnownChunkCount = currentChunkCount;
            if (stallTimerId) {
                clearTimeout(stallTimerId);
                stallTimerId = null;
            }
        }

        const timeRemaining = audioElement.duration - audioElement.currentTime;

        // Condition to START the watchdog:
        // 1. We are within the last 5 seconds.
        // 2. The player is running.
        // 3. A timer isn't already set.
        if (audioElement.duration > 0 && timeRemaining <= 5 && !audioElement.paused && !stallTimerId) {
            // If we don't get a new chunk in the next 2.5 seconds, assume it's finished.
            stallTimerId = setTimeout(() => {
                console.log('Playback stalled in the last 5 seconds. Assuming end of track and triggering download.');
                updateStatus('Playback finished (stall detected).');
                triggerDownload();
            }, 2500);
        }
    };

    audioElement.addEventListener('timeupdate', stallWatcher);
    // --- END OF NEW LOGIC ---


    // If track is already finished, trigger download immediately.
    if (audioElement.duration > 0 && audioElement.currentTime >= audioElement.duration - 0.5) {
        console.log("Track already finished. Triggering download now.");
        updateStatus("Audio already played, downloading...");
        triggerDownload();
        return;
    }

    // The 'ended' event is our primary, clean trigger. The stall detector is a fallback.
    audioElement.addEventListener('ended', () => {
        console.log('Official "ended" event fired. Triggering download.');
        updateStatus('Playback finished.');
        triggerDownload();
    }, { once: true });

    // Start the high-speed capture process
    updateStatus("Capturing audio data (this is fast)...");
    console.log("Speeding up and playing audio to capture all chunks...");
    audioElement.currentTime = 0;
    audioElement.playbackRate = 16;
    audioElement.muted = true;
    audioElement.play().catch(e => {
        console.error("Play-automation failed:", e);
        updateStatus("Error: Please click the page once and try again.");
    });
}

// Poll for the 'as' object before starting everything.
let attempts = 0;
const intervalId = setInterval(() => {
    if (window.as) {
        clearInterval(intervalId);
        automate();
    } else if (attempts++ > 20) { // Try for 5 seconds
        clearInterval(intervalId);
        updateStatus("Error: Player object timed out.");
        console.error("Timed out waiting for window.as");
    }
}, 250);