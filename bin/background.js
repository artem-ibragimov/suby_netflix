'use strict';

function parse(text) {
    return text
        .split('\n')
        .map((line) => /begin="(\d+)t" end="(\d+)t".*>([^[>|<|/]+)<.*/.exec(line))
        .filter((result) => result !== null)
        .filter((result) => result.length === 4)
        .map(([_, start, end, txt]) => [Number(start) / 10000000, Number(end) / 10000000, txt]);
}

// @ts-ignore
chrome.webRequest.onCompleted.addListener((details) => {
    if (details.initiator === location.origin) {
        return;
    }
    fetch(details.url)
        .then((res) => res.text())
        .then(parse)
        .then(sendToOpenedTab)
        .catch(console.error);
}, {
    types: ['xmlhttprequest'],
    urls: ['https:\/\/*.oca.nflxvideo.net/?*']
});
function sendToOpenedTab(message) {
    // @ts-ignore
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
            return;
        }
        // @ts-ignore
        chrome.tabs.sendMessage(tabs[0].id, message);
    });
}
