function updateStatus(message, progress = null) {
    window.postMessage({ type: "HOTAUDIO_DOWNLOAD_STATUS", message: message, progress: progress }, "*");
}

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

    function cleanup() {
        console.log("Cleaning up listeners and timers.");
        if (progressInterval) clearInterval(progressInterval);
        if (stallTimerId) clearTimeout(stallTimerId);
        audioElement.removeEventListener('timeupdate', stallWatcher);
        audioElement.removeEventListener('ended', handleEnded);
        audioElement.pause();
        window.HOTAUDIO_DOWNLOAD_IN_PROGRESS = false;
    }

    window.HOTAUDIO_CANCEL_DOWNLOAD = () => {
        console.log("Cancellation requested.");
        cleanup();
        window.DECRYPTED_AUDIO_CHUNKS = [];
        updateStatus("Capture cancelled by user.", -1);
    };

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

    const startProgressUpdater = () => {
        progressInterval = setInterval(() => {
            if (audioElement.duration > 0) {
                const percent = (audioElement.currentTime / audioElement.duration) * 100;
                const formatTime = (s) => new Date(s * 1000).toISOString().substr(11, 8);
                const currentTimeStr = formatTime(audioElement.currentTime);
                const totalTimeStr = formatTime(audioElement.duration);
                const message = `Capturing: ${currentTimeStr} / ${totalTimeStr}`;
                updateStatus(message, percent);
            }
        }, 500);
    };

    const triggerDownload = () => {
        if (downloadTriggered) return;
        downloadTriggered = true;
        cleanup();

        if (window.DECRYPTED_AUDIO_CHUNKS && window.DECRYPTED_AUDIO_CHUNKS.length > 0) {
            updateStatus("Stitching audio chunks...", 100);
            const blob = new Blob(window.DECRYPTED_AUDIO_CHUNKS, { type: 'audio/mp4' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            let filename = document.title.replace(' - Hotaudio', '').trim().replace(/[\\/:"*?<>|]/g, '_') || 'decrypted_audio';
            a.href = url;
            a.download = `${filename}.m4a`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                updateStatus("Download complete!", 100);
            }, 300);
        } else {
            updateStatus("Error: No audio data captured!", -1);
        }
    };

    const stallWatcher = () => {
        if (downloadTriggered) return;
        if (audioElement.duration > 0 && (audioElement.duration - audioElement.currentTime <= 5) && !audioElement.paused && !stallTimerId) {
            stallTimerId = setTimeout(() => {
                updateStatus('Playback finished (stall detected).', 100);
                triggerDownload();
            }, 2500);
        }
    };

    const handleEnded = () => {
        updateStatus('Playback finished.', 100);
        triggerDownload();
    };

    audioElement.addEventListener('timeupdate', stallWatcher);
    if (audioElement.duration > 0 && audioElement.currentTime >= audioElement.duration - 0.5) {
        updateStatus("Audio already played, downloading...", 100);
        triggerDownload();
        return;
    }
    audioElement.addEventListener('ended', handleEnded, { once: true });

    updateStatus("Capturing audio data...", 0);
    startProgressUpdater();
    audioElement.currentTime = 0;
    audioElement.playbackRate = 16;
    audioElement.muted = true;
    audioElement.play().catch(e => {
        console.error("Play-automation failed:", e);
        cleanup();
        updateStatus("Error: Click page and try again.", -1);
    });
}

if (window.HOTAUDIO_DOWNLOAD_IN_PROGRESS) {
    console.log("Download already in progress. Ignoring new request.");
} else {
    window.HOTAUDIO_DOWNLOAD_IN_PROGRESS = true;
    let attempts = 0;
    const intervalId = setInterval(() => {
        if (window.as) {
            clearInterval(intervalId);
            automate();
        } else if (attempts++ > 20) {
            clearInterval(intervalId);
            updateStatus("Error: Player object timed out.", -1);
            window.HOTAUDIO_DOWNLOAD_IN_PROGRESS = false;
        }
    }, 250);
}