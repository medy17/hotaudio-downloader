console.log("Hotaudio Downloader content script (message bridge) loaded.");

window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data.type === "HOTAUDIO_DOWNLOAD_STATUS") {
        chrome.runtime.sendMessage({
            action: "updateStatus",
            message: event.data.message,
            progress: event.data.progress
        });
    } else if (event.data.type === "HOTAUDIO_DURATION_INFO") {
        chrome.runtime.sendMessage({
            action: "durationInfo",
            duration: event.data.duration
        });
    }
});