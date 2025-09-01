document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const downloadBtn = document.getElementById('downloadBtn');
    const btnText = document.getElementById('btnText');
    const statusEl = document.getElementById('status');
    const warningEl = document.getElementById('warning');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');

    /**
     * Updates the entire popup UI based on the current state.
     * @param {object|null} state - The state object from the background script.
     */
    function updateUI(state) {
        // Default/Ready State
        if (!state) {
            statusEl.textContent = 'Ready to download.';
            btnText.textContent = 'Download Audio';
            downloadBtn.className = '';
            downloadBtn.disabled = false;
            progressContainer.style.display = 'none';
            warningEl.style.display = 'none';
            progressBar.classList.remove('success-progress', 'error-progress');
            return;
        }

        // Update status text
        statusEl.textContent = state.message;

        // Check for and display the duration warning
        if (state.duration > 600) { // 600 seconds = 10 minutes
            const minutes = Math.floor(state.duration / 60);
            warningEl.textContent = `Warning: This is a long audio file (~${minutes} minutes). The capture process may take some time.`;
            warningEl.style.display = 'block';
        } else {
            warningEl.style.display = 'none';
        }

        // Handle Error State
        if (state.message.includes("Error") || state.message.includes("timed out")) {
            btnText.textContent = 'Error Occurred';
            downloadBtn.className = 'error';
            downloadBtn.disabled = false; // Allow retry
            progressContainer.style.display = 'block';
            progressBar.value = 100; // Show a full bar for error
            progressBar.classList.add('error-progress');
            progressBar.classList.remove('success-progress');
            return;
        }

        // Handle Success State
        if (state.message.includes("complete")) {
            btnText.textContent = 'Download Complete!';
            downloadBtn.className = 'success';
            downloadBtn.disabled = false;
            progressContainer.style.display = 'block';
            progressBar.value = 100;
            progressBar.classList.add('success-progress');
            progressBar.classList.remove('error-progress');
            return;
        }

        // Handle Working/In-Progress State
        if (state.progress !== null && state.progress >= 0) {
            btnText.textContent = 'Capturing...';
            downloadBtn.className = 'working';
            downloadBtn.disabled = true;
            progressContainer.style.display = 'block';
            progressBar.value = state.progress;
            progressBar.classList.remove('success-progress', 'error-progress');
        }
    }

    // When popup opens, immediately ask the background script for the current state
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
            chrome.runtime.sendMessage({ action: "getTabState", tabId: tabs[0].id }, (response) => {
                if(chrome.runtime.lastError) {
                    console.warn("Could not get tab state:", chrome.runtime.lastError.message);
                    updateUI(null); // Reset to default state
                } else {
                    updateUI(response);
                }
            });
        }
    });

    // Listen for real-time updates pushed from the content script
    chrome.runtime.onMessage.addListener((request, sender) => {
        // Only update if the message is from our active tab's content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && sender.tab && sender.tab.id === tabs[0].id) {
                if(request.action === "updateStatus") {
                    updateUI(request);
                }
            }
        });
    });

    // The download button click handler
    downloadBtn.addEventListener('click', () => {
        // Set UI to initial working state immediately for responsiveness
        updateUI({ message: 'Initializing...', progress: 0 });

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0 || !tabs[0].id) {
                updateUI({ message: 'Error: No active tab found.', progress: -1 });
                return;
            }
            const tabId = tabs[0].id;

            chrome.scripting.executeScript({
                target: { tabId: tabId },
                world: 'MAIN',
                files: ['main_world.js']
            }).catch(err => {
                console.error("Failed to inject script:", err);
                updateUI({ message: 'Error: Failed to inject script.', progress: -1 });
            });
        });
    });
});