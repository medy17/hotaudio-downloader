console.log("Hotaudio Downloader content script (message bridge) loaded.");

window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    const { type, message, progress, duration } = event.data;

    if (type === "HOTAUDIO_DOWNLOAD_STATUS") {
        chrome.runtime.sendMessage({
            action: "updateStatus",
            message: message,
            progress: progress
        });
    } else if (type === "HOTAUDIO_DURATION_INFO") {
        chrome.runtime.sendMessage({
            action: "durationInfo",
            duration: duration
        });
    } else if (type === "HOTAUDIO_PLAYER_READY") {
        chrome.runtime.sendMessage({ action: "playerReady" });
    }
});