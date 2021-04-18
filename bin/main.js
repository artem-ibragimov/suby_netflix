'use strict';

(async function () {
    // @ts-ignore
    chrome.runtime.onMessage.addListener((subs, _sender, sendResponse) => {
        debugger;
        return true;
    });
})();
