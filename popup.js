document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('downloadBtn');
    const statusEl = document.getElementById('status');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');

    function updateUI(state) {
        if (!state) {
            statusEl.textContent = 'Ready to download.';
            progressContainer.style.display = 'none';
            downloadBtn.disabled = false;
            return;
        }

        statusEl.textContent = state.message;

        if (state.progress !== null && state.progress >= 0) {
            progressContainer.style.display = 'block';
            progressBar.value = state.progress;
            downloadBtn.disabled = true;
        } else {
            progressContainer.style.display = 'none';
        }

        if (state.progress === 100 || state.message.includes("Error") || state.message.includes("complete") || state.message.includes("timed out")) {
            downloadBtn.disabled = false;
        } else {
            downloadBtn.disabled = true;
        }
    }

    // When popup opens, immediately ask the background script for the current state
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
            chrome.runtime.sendMessage({ action: "getTabState", tabId: tabs[0].id }, (response) => {
                if(chrome.runtime.lastError) {
                    // This can happen if the background script is not ready, just ignore
                    console.warn("Could not get tab state:", chrome.runtime.lastError.message);
                } else {
                    updateUI(response);
                }
            });
        }
    });

    // Listen for real-time updates pushed from the background script
    chrome.runtime.onMessage.addListener((state) => {
        // We don't use a request object here, the background just broadcasts the state
        updateUI(state);
    });

    // The download button click handler
    downloadBtn.addEventListener('click', () => {
        downloadBtn.disabled = true;
        statusEl.textContent = 'Initializing...';

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0 || !tabs[0].id) {
                statusEl.textContent = 'Error: No active tab found.';
                downloadBtn.disabled = false;
                return;
            }
            const tabId = tabs[0].id;

            // This is the correct place for executeScript
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