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
        // This targets any URL containing "nozzle.js"
        // The wildcard '*' accounts for the changing version string (e.g., ?v=X25WLG6A)
        urlFilter: 'nozzle.js',
        resourceTypes: ['script'],
    },
};

// This function is called when the extension is installed or updated.
chrome.runtime.onInstalled.addListener(() => {
    chrome.declarativeNetRequest.getDynamicRules(async (rules) => {
        const existingRule = rules.find(rule => rule.id === RULE_ID);
        if (!existingRule) {
            console.log("Adding nozzle.js redirect rule.");
            await chrome.declarativeNetRequest.updateDynamicRules({
                addRules: [nozzleRule],
            });
        } else {
            console.log("nozzle.js redirect rule already exists.");
        }
    });
});