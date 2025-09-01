// This script is now just a message bridge.
console.log("Hotaudio Downloader content script (message bridge) loaded.");

window.addEventListener("message", (event) => {
    if (event.source === window && event.data.type === "HOTAUDIO_DOWNLOAD_STATUS") {
        // Relay the message WITH progress to the background script
        chrome.runtime.sendMessage({
            action: "updateStatus",
            message: event.data.message,
            progress: event.data.progress
        });
    }
});