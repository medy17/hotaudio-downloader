console.log("Hotaudio Downloader content script (message bridge) loaded.");

window.addEventListener("message", (event) => {
    // We only accept messages from our own window
    if (event.source !== window) return;

    // Relay status messages to the background script
    if (event.data.type === "HOTAUDIO_DOWNLOAD_STATUS") {
        chrome.runtime.sendMessage({
            action: "updateStatus",
            message: event.data.message,
            progress: event.data.progress
        });
        // Relay duration info to the background script
    } else if (event.data.type === "HOTAUDIO_DURATION_INFO") {
        chrome.runtime.sendMessage({
            action: "durationInfo",
            duration: event.data.duration
        });
    }
});