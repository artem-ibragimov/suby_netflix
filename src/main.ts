import { ISubs } from './subs';

(async function () {
   // @ts-ignore
   chrome.runtime.onMessage.addListener((subs: ISubs, _sender, sendResponse) => {
      debugger;
      return true;
   });
})();