// This rule intercepts the original nozzle.js and serves our modified version instead.
const RULE_ID = 1;
const nozzleRule = {
    id: RULE_ID,
    priority: 1,
    action: {
        type: 'redirect',
        redirect: {
            extensionPath: '/modified_nozzle.js',
        },
    },
    condition: {
        urlFilter: 'nozzle.js',
        resourceTypes: ['script'],
    },
};

// This function is called when the extension is installed or updated.
chrome.runtime.onInstalled.addListener(() => {
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [RULE_ID], // Ensure old rule is removed before adding
        addRules: [nozzleRule],
    });
    console.log("Hotaudio Downloader: nozzle.js redirect rule has been set.");
});


// --- ICON AND STATE MANAGEMENT LOGIC ---

const tabStates = {}; // Our persistent store for download states
let iconBitmap = null; // Cache for the base icon image

/**
 * Resets the toolbar icon for a specific tab to the default.
 * @param {number} tabId The ID of the tab to reset.
 */
function resetIcon(tabId) {
    if (tabId) {
        chrome.action.setIcon({
            tabId: tabId,
            path: {
                "16": "icons/icon16.png",
                "48": "icons/icon48.png",
                "128": "icons/icon128.png",
            },
        });
    }
}

/**
 * Draws a progress ring on the extension icon.
 * @param {number} tabId The ID of the tab to update.
 * @param {number} progress The progress percentage (0-100).
 */
async function updateIconProgress(tabId, progress) {
    // Load the base icon image only once and cache it
    if (!iconBitmap) {
        try {
            const response = await fetch(chrome.runtime.getURL('icons/icon128.png'));
            const blob = await response.blob();
            iconBitmap = await createImageBitmap(blob);
        } catch (e) {
            console.error("Could not load base icon:", e);
            return;
        }
    }

    const canvas = new OffscreenCanvas(128, 128);
    const ctx = canvas.getContext('2d');

    // Clear canvas and draw the base icon
    ctx.clearRect(0, 0, 128, 128);
    ctx.drawImage(iconBitmap, 0, 0, 128, 128);

    // Styling for the progress ring
    const center = 64;
    const radius = 58;
    ctx.lineWidth = 25;

    // Draw the background ring (dark grey)
    ctx.strokeStyle = '#3a3f4b';
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.stroke();

    if (progress > 0) {
        // Draw the progress arc (orange)
        ctx.strokeStyle = '#ed662e';
        ctx.beginPath();
        const startAngle = -Math.PI / 2; // Start from the top
        const endAngle = startAngle + (progress / 100) * 2 * Math.PI;
        ctx.arc(center, center, radius, startAngle, endAngle);
        ctx.stroke();
    }

    // Set the canvas as the new icon
    const imageData = ctx.getImageData(0, 0, 128, 128);
    chrome.action.setIcon({ tabId: tabId, imageData: imageData });
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const tabId = request.tabId || (sender.tab ? sender.tab.id : null);
    if (!tabId) return true;

    if (request.action === "updateStatus") {
        // Merge new state with any existing state (like duration)
        tabStates[tabId] = { ...tabStates[tabId], ...request };

        if (request.progress !== null && request.progress >= 0) {
            updateIconProgress(tabId, request.progress);
        }

        // If the download is complete or failed, clear the state and reset icon after a delay
        if (request.progress === 100 || request.message.includes("Error")) {
            setTimeout(() => {
                delete tabStates[tabId];
                resetIcon(tabId);
            }, 5000); // Keep state for 5 seconds for user to see
        }

    } else if (request.action === "durationInfo") {
        // Store the duration when we receive it
        tabStates[tabId] = { ...tabStates[tabId], duration: request.duration };

    } else if (request.action === "getTabState") {
        // The popup is asking for the current state for its tab
        sendResponse(tabStates[tabId]);
    }

    // Keep the message channel open for asynchronous responses
    return true;
});