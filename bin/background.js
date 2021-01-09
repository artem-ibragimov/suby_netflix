'use strict';

// https://www.chromium.org/Home/chromium-security/extension-content-script-fetches#TOC-2.-Avoid-Cross-Origin-Fetches-in-Content-Scripts
// @ts-ignore
chrome.runtime.onMessage.addListener(({ url, options }, _sender, sendResponse) => {
    fetch(url, options)
        .then((res) => res.json())
        .then(sendResponse, sendResponse);
    return true;
});
