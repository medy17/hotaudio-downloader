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

// --- MODIFIED: We now cache two separate images ---
let iconBaseBitmap = null;    // Cache for the default icon (dimmed background)
let iconProgressBitmap = null; // Cache for your custom progress icon (the reveal)


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
 * Draws a pie chart reveal effect using the custom progress icon.
 * @param {number} tabId The ID of the tab to update.
 * @param {number} progress The progress percentage (0-100).
 */
async function updateIconProgress(tabId, progress) {
    // We only need to load and cache the custom progress icon for this function.
    if (!iconProgressBitmap) {
        try {
            const response = await fetch(chrome.runtime.getURL('icons/icon_progress.png'));
            const blob = await response.blob();
            iconProgressBitmap = await createImageBitmap(blob);
        } catch (e) {
            console.error("Could not load custom progress icon:", e);
            return;
        }
    }

    const canvas = new OffscreenCanvas(128, 128);
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, 128, 128);

    // 1. Draw the custom icon, dimmed, as the full background.
    ctx.globalAlpha = 0.4;
    ctx.drawImage(iconProgressBitmap, 0, 0, 128, 128);
    ctx.globalAlpha = 1.0; // Reset alpha

    if (progress > 0) {
        // 2. Create the "pie slice" clipping path.
        const center = 64;
        const radius = 64;
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (progress / 100) * 2 * Math.PI;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.clip();

        // 3. Draw the full-color custom icon again, but only inside the clipped area.
        ctx.drawImage(iconProgressBitmap, 0, 0, 128, 128);

        ctx.restore();
    }

    // 4. Set the generated canvas as the new icon for the tab.
    const imageData = ctx.getImageData(0, 0, 128, 128);
    chrome.action.setIcon({ tabId: tabId, imageData: imageData });
}

// --- The message listener remains the same ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const tabId = request.tabId || (sender.tab ? sender.tab.id : null);
    if (!tabId) return true;

    if (request.action === "updateStatus") {
        tabStates[tabId] = { ...tabStates[tabId], ...request };

        if (request.progress !== null && request.progress >= 0) {
            updateIconProgress(tabId, request.progress);
        }

        if (request.progress === 100 || request.message.includes("Error")) {
            setTimeout(() => {
                delete tabStates[tabId];
                resetIcon(tabId);
            }, 5000);
        }

    } else if (request.action === "durationInfo") {
        tabStates[tabId] = { ...tabStates[tabId], duration: request.duration };

    } else if (request.action === "getTabState") {
        sendResponse(tabStates[tabId]);
    }

    return true;
});