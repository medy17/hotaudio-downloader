document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('downloadBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const btnText = document.getElementById('btnText');
    const statusEl = document.getElementById('status');
    const warningEl = document.getElementById('warning');

    function updateUI(state) {
        // Clear progress style by default
        downloadBtn.style.removeProperty('--progress-percent');
        downloadBtn.style.removeProperty('background-image');

        // Default/Unready State
        if (!state) {
            statusEl.textContent = 'Waiting for player...';
            btnText.textContent = 'Initializing...';
            downloadBtn.className = '';
            downloadBtn.disabled = true;
            warningEl.style.display = 'none';
            cancelBtn.style.display = 'none';
            return;
        }

        // Handle Ready State (before download starts)
        if (state.isReady && !state.message) {
            statusEl.textContent = 'Ready to download.';
            btnText.textContent = 'Download Audio';
            downloadBtn.className = '';
            downloadBtn.disabled = false;
        }

        if (state.message) {
            statusEl.textContent = state.message;
        }

        if (state.duration && state.duration > 600) { // 10 minutes
            const minutes = Math.floor(state.duration / 60);
            warningEl.textContent = `Warning: This is a long audio file (~${minutes} mins). The capture process may take some time.`;
            warningEl.style.display = 'block';
        } else {
            warningEl.style.display = 'none';
        }

        if (state.message?.includes("Error") || state.message?.includes("timed out") || state.message?.includes("cancelled")) {
            btnText.textContent = state.message.includes("cancelled") ? 'Cancelled' : 'Error Occurred';
            downloadBtn.className = 'error';
            downloadBtn.disabled = false; // Allow retry
            cancelBtn.style.display = 'none';
            return;
        }

        if (state.message?.includes("complete")) {
            btnText.textContent = 'Download Complete!';
            downloadBtn.className = 'success';
            downloadBtn.disabled = false;
            cancelBtn.style.display = 'none';
            return;
        }

        if (state.progress !== undefined && state.progress >= 0) {
            const percent = Math.floor(state.progress);
            btnText.textContent = `Capturing... ${percent}%`; // NEW: Update text with percentage
            downloadBtn.className = 'working';
            downloadBtn.disabled = true;
            // NEW: Set CSS custom property for the gradient background
            downloadBtn.style.setProperty('--progress-percent', `${state.progress}%`);
            cancelBtn.style.display = 'block';
        } else {
            cancelBtn.style.display = 'none';
        }
    }

    function fetchAndUpdateState() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.runtime.sendMessage({ action: "getTabState", tabId: tabs[0].id }, (response) => {
                    if (chrome.runtime.lastError) {
                        updateUI(null);
                    } else {
                        updateUI(response);
                    }
                });
            } else {
                updateUI(null);
            }
        });
    }

    fetchAndUpdateState();

    chrome.runtime.onMessage.addListener((request, sender) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && sender.tab && sender.tab.id === tabs[0].id) {
                fetchAndUpdateState();
            }
        });
    });

    downloadBtn.addEventListener('click', () => {
        updateUI({ message: 'Initializing...', progress: 0 });
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0 || !tabs[0].id) return;
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                world: 'MAIN',
                files: ['main_world.js']
            });
        });
    });

    cancelBtn.addEventListener('click', () => {
        cancelBtn.disabled = true;
        cancelBtn.textContent = 'Cancelling...';
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0 || !tabs[0].id) return;
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                world: 'MAIN',
                func: () => {
                    if (window.HOTAUDIO_CANCEL_DOWNLOAD) {
                        window.HOTAUDIO_CANCEL_DOWNLOAD();
                    }
                }
            }).then(() => {
                setTimeout(() => {
                    cancelBtn.disabled = false;
                    cancelBtn.textContent = 'Cancel';
                }, 1000);
            });
        });
    });
});