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
    chrome.declarativeNetRequest.getDynamicRules(async (rules) => {
        const existingRule = rules.find(rule => rule.id === RULE_ID);
        const ruleIdsToRemove = existingRule ? [RULE_ID] : [];

        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: ruleIdsToRemove,
            addRules: [nozzleRule],
        });
        console.log("Hotaudio Downloader: nozzle.js redirect rule has been set.");
    });
});


// --- STATE MANAGEMENT LOGIC ---
const tabStates = {}; // Our persistent store for download states

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Use the tabId from the sender if it exists
    const tabId = request.tabId || (sender.tab ? sender.tab.id : null);
    if (!tabId) return;

    if (request.action === "updateStatus") {
        // A download is in progress, store its state
        tabStates[tabId] = {
            message: request.message,
            progress: request.progress,
        };

        // Also forward the message to the popup if it's open
        chrome.runtime.sendMessage(tabStates[tabId]);

        // If the download is complete or failed, clear the state after a delay
        if (request.progress === 100 || request.message.includes("Error") || request.message.includes("complete")) {
            setTimeout(() => {
                delete tabStates[tabId];
            }, 5000); // Keep state for 5 seconds for user to see
        }

    } else if (request.action === "getTabState") {
        // The popup is asking for the current state for its tab
        sendResponse(tabStates[tabId]);
    }

    // Keep the message channel open for the asynchronous response
    return true;
});