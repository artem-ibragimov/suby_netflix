import * as subs from 'src/subs';

// @ts-ignore
chrome.webRequest.onCompleted.addListener((details) => {
   if (details.initiator === location.origin) { return; }
   fetch(details.url)
      .then((res) => res.text())
      .then(subs.parse)
      .then(sendToOpenedTab)
      .catch(console.error);
}, {
   types: ['xmlhttprequest'],
   urls: ['https:\/\/*.oca.nflxvideo.net/?*']
});

function sendToOpenedTab(message: any) {
   // @ts-ignore
   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) { return; }
      // @ts-ignore
      chrome.tabs.sendMessage(tabs[0].id, message);
   });
}
