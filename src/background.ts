// https://www.chromium.org/Home/chromium-security/extension-content-script-fetches#TOC-2.-Avoid-Cross-Origin-Fetches-in-Content-Scripts
// @ts-ignore
chrome.runtime.onMessage.addListener((
   { url, options }: { url: string; options: RequestInit; },
   _sender: object,
   sendResponse: (res: Response) => void) => {
   fetch(url, options)
      .then((res: Response) => res.json())
      .then(sendResponse, sendResponse);

   return true;
});