document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('downloadBtn');
    const statusEl = document.getElementById('status');

    // Listen for status updates relayed from the content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "updateStatus") {
            statusEl.textContent = request.message;
            // Re-enable the button if the process is finished or errored out
            if (request.message.includes("Error") || request.message.includes("complete") || request.message.includes("timed out")) {
                downloadBtn.disabled = false;
            }
        }
    });

    downloadBtn.addEventListener('click', () => {
        downloadBtn.disabled = true;
        statusEl.textContent = 'Initializing...';

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                statusEl.textContent = 'Error: No active tab found.';
                downloadBtn.disabled = false;
                return;
            }
            const tabId = tabs[0].id;

            // THIS IS THE CORRECT PLACE FOR executeScript
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                world: 'MAIN', // Execute in the page's main world
                files: ['main_world.js'] // Inject the file containing our logic
            }).catch(err => {
                console.error("Failed to inject script:", err);
                statusEl.textContent = 'Error: Failed to inject script.';
                downloadBtn.disabled = false;
            });
        });
    });
});