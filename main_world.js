// This file is injected and run in the page's MAIN world.

function updateStatus(message, progress = null) {
    window.postMessage({ type: "HOTAUDIO_DOWNLOAD_STATUS", message: message, progress: progress }, "*");
}

/**
 * The main automation function that controls the audio player and triggers the download.
 */
function automate() {
    const audioSource = window.as;
    if (!audioSource || !audioSource.el) {
        updateStatus("Error: Player not found!", -1);
        console.error("Injected script could not find window.as");
        return;
    }

    const audioElement = audioSource.el;
    let downloadTriggered = false;
    let progressInterval = null;
    let stallTimerId = null;
    let lastKnownChunkCount = 0;

    /**
     * Sends the audio duration to the extension as soon as it's available.
     */
    const sendDurationInfo = () => {
        const checkDuration = () => {
            if (audioElement.duration && isFinite(audioElement.duration)) {
                window.postMessage({ type: "HOTAUDIO_DURATION_INFO", duration: audioElement.duration }, "*");
            }
        };
        if (audioElement.readyState > 0) {
            checkDuration();
        } else {
            audioElement.addEventListener('loadedmetadata', checkDuration, { once: true });
        }
    };
    sendDurationInfo();

    /**
     * Starts an interval that periodically sends progress updates.
     */
    const startProgressUpdater = () => {
        progressInterval = setInterval(() => {
            if (audioElement.duration > 0) {
                const percent = (audioElement.currentTime / audioElement.duration) * 100;
                updateStatus("Capturing audio: " + Math.floor(percent) + "%", percent);
            }
        }, 500); // Update twice a second
    };

    /**
     * Finalizes the process, stitching chunks and initiating the download.
     */
    const triggerDownload = () => {
        if (downloadTriggered) return;
        downloadTriggered = true;

        // Clean up all timers and listeners
        clearInterval(progressInterval);
        clearTimeout(stallTimerId);
        audioElement.removeEventListener('timeupdate', stallWatcher);

        if (window.DECRYPTED_AUDIO_CHUNKS && window.DECRYPTED_AUDIO_CHUNKS.length > 0) {
            updateStatus("Stitching audio chunks...", 100);
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
                updateStatus("Download complete!", 100);
                console.log("Download process finished.");
            }, 300);
        } else {
            updateStatus("Error: No audio data captured!", -1);
            console.error("Error: No decrypted audio chunks were found.");
        }
    };

    /**
     * A watchdog function that monitors playback near the end of the track.
     */
    const stallWatcher = () => {
        if (downloadTriggered) return;

        const currentChunkCount = window.DECRYPTED_AUDIO_CHUNKS ? window.DECRYPTED_AUDIO_CHUNKS.length : 0;
        if (currentChunkCount > lastKnownChunkCount) {
            lastKnownChunkCount = currentChunkCount;
            if (stallTimerId) {
                clearTimeout(stallTimerId);
                stallTimerId = null;
            }
        }

        const timeRemaining = audioElement.duration - audioElement.currentTime;

        if (audioElement.duration > 0 && timeRemaining <= 5 && !audioElement.paused && !stallTimerId) {
            stallTimerId = setTimeout(() => {
                console.log('Playback stalled. Assuming end of track and triggering download.');
                updateStatus('Playback finished (stall detected).', 100);
                triggerDownload();
            }, 2500);
        }
    };

    audioElement.addEventListener('timeupdate', stallWatcher);

    // If the track is already effectively finished, download immediately.
    if (audioElement.duration > 0 && audioElement.currentTime >= audioElement.duration - 0.5) {
        console.log("Track already finished. Triggering download now.");
        updateStatus("Audio already played, downloading...", 100);
        triggerDownload();
        return;
    }

    // The 'ended' event is the primary trigger.
    audioElement.addEventListener('ended', () => {
        console.log('Official "ended" event fired. Triggering download.');
        updateStatus('Playback finished.', 100);
        triggerDownload();
    }, { once: true });

    // Start the high-speed data capture process.
    updateStatus("Capturing audio data...", 0);
    startProgressUpdater();
    console.log("Speeding up and playing audio to capture all chunks...");
    audioElement.currentTime = 0;
    audioElement.playbackRate = 16;
    audioElement.muted = true;
    audioElement.play().catch(e => {
        console.error("Play-automation failed:", e);
        updateStatus("Error: Please click the page once and try again.", -1);
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
        updateStatus("Error: Player object timed out.", -1);
        console.error("Timed out waiting for window.as");
    }
}, 250);