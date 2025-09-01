const tabStates = {};
let iconProgressBitmap = null;

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

async function updateIconProgress(tabId, progress) {
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

    ctx.clearRect(0, 0, 128, 128);

    ctx.globalAlpha = 0.4;
    ctx.drawImage(iconProgressBitmap, 0, 0, 128, 128);
    ctx.globalAlpha = 1.0; // Reset alpha

    if (progress > 0) {
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

        ctx.drawImage(iconProgressBitmap, 0, 0, 128, 128);

        ctx.restore();
    }

    const imageData = ctx.getImageData(0, 0, 128, 128);
    chrome.action.setIcon({ tabId: tabId, imageData: imageData });
}

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