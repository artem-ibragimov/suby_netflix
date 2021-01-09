"use strict";chrome.runtime.onMessage.addListener((({url:e,options:t},n,s)=>(fetch(e,t).then((e=>e.json())).then(s,s),!0)));
