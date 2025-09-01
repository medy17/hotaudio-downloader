console.log("Hotaudio Downloader content script (message bridge) loaded.");

// Listen for status messages coming FROM the injected main_world.js script
window.addEventListener("message", (event) => {
    // We only accept messages from our injected script
    if (event.source === window && event.data.type === "HOTAUDIO_DOWNLOAD_STATUS") {
        // Relay the message to the popup script
        chrome.runtime.sendMessage({ action: "updateStatus", message: event.data.message });
    }
});