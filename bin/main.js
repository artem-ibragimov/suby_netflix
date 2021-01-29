'use strict';

const DEFAULT_REQUEST_OPTIONS = {
    url: '/',
};
class DataSource {
    constructor(default_data) {
        this.default_data = default_data;
        this.onerror = this.onerror.bind(this);
        this.onload = this.onload.bind(this);
        this.data = default_data;
    }
    async load(shortcut, request_options) {
        this.request_options = {
            ...DEFAULT_REQUEST_OPTIONS,
            ...request_options
        };
        return new Promise((resolve) => {
            // @ts-ignore
            chrome.runtime.sendMessage({
                url: this.request_options.url,
                options: this.request_options
            }, resolve);
        })
            .then((data) => this.onload(shortcut, data))
            .catch(this.onerror);
    }
    has(shortcut) {
        return shortcut in this.data;
    }
    onerror(e) {
        this.data = this.default_data;
        console.error(e);
    }
}

var DATA_SOURCE_TYPE;
(function (DATA_SOURCE_TYPE) {
    DATA_SOURCE_TYPE["WordPress"] = "WordPress";
})(DATA_SOURCE_TYPE || (DATA_SOURCE_TYPE = {}));
const DATA_SOURCE_TYPES = [DATA_SOURCE_TYPE.WordPress];

class Popup {
    constructor(update, request_interval, wrap_link = true) {
        this.request_interval = request_interval;
        this.wrap_link = wrap_link;
        this.listenUserActions = () => Promise.resolve('');
        this.update = (v) => update(v).then(this.updateContent);
    }
    show(data) {
        return new Promise((resolve, reject) => {
            const [onKeyUp] = this.listenPopupCloseEvents(resolve, reject);
            this.overlay = this.createOverlayElement();
            this.popup = this.createPopupElement(this.getContent(data));
            this.popup.addEventListener('keyup', onKeyUp);
            this.overlay.appendChild(this.popup);
            document.body.appendChild(this.overlay);
            this.listenUserActions().then(resolve, reject);
        });
    }
    close() {
        this.overlay?.remove();
    }
    listenPopupCloseEvents(resolve, reject) {
        const dispose = () => {
            document.removeEventListener('click', onClickOutSide);
            this.close();
            reject(new Error('No value'));
        };
        const onClickOutSide = (e) => {
            if (this.popup && e.composedPath().includes(this.popup)) {
                return;
            }
            dispose();
        };
        document.addEventListener('click', onClickOutSide);
        const onKeyUp = (e) => {
            if (e.code !== 'Escape') {
                return;
            }
            e.stopPropagation();
            dispose();
        };
        document.addEventListener('keyup', onKeyUp);
        return [onKeyUp];
    }
    createOverlayElement() {
        const overlay = document.createElement('div');
        overlay.setAttribute('style', `justify-content: center;
         align-items: center;
         position: fixed;
         z-index: 999999;
         display: flex;
         bottom: 0;
         right: 0;
         left: 0;
         top: 0;
         `);
        return overlay;
    }
    createPopupElement(html) {
        const popup = document.createElement('div');
        popup.setAttribute('style', `
         border: 1px solid #ccc;
         border-radius: 5px;
         position: absolute;
         line-height: 1 !important;
         background: #eee;
         padding: 10px;
         margin: auto;
         width: 500px;
         `);
        html.forEach((child) => { popup.appendChild(child); });
        return popup;
    }
}

class SearchPopup extends Popup {
    constructor() {
        super(...arguments);
        this.updateContent = (data) => {
            if (!this.search_results) {
                return;
            }
            this.search_results.innerHTML = data.map(generateListItem).join('\n');
        };
        this.listenUserActions = () => new Promise((resolve) => {
            if (!this.search_field) {
                return resolve('');
            }
            let prev_value = '';
            this.search_field.addEventListener('keyup', (e) => {
                if (this.search_field.value === prev_value) {
                    return;
                }
                prev_value = this.search_field.value;
                clearTimeout(this.timeoutID);
                this.timeoutID = setTimeout(() => {
                    this.update(this.search_field.value).then(() => { this.initHotKeys(resolve); });
                }, this.request_interval);
            });
            this.search_field?.focus();
        }).then((v) => {
            this.close();
            return v;
        });
    }
    getContent() {
        this.search_field = document.createElement('input');
        this.search_field.classList.add('QuickLink__SearchPopup__search_field');
        this.search_field.setAttribute('data-replace', 'disable');
        this.search_field.setAttribute('autofocus', 'true');
        this.search_field.setAttribute('placeholder', 'Search links');
        this.search_field.setAttribute('style', `
         margin: 0 !important;
         height: 25px;
         width: 100%;
         box-shadow: inset 0 1px 3px #ddd;
         letter-spacing: .01em;
         border: 1px solid #ccc;
         box-sizing: border-box;
         border-radius: 3px;
         text-transform: none;
         padding: 4px; `);
        this.search_results = document.createElement('div');
        this.search_results.classList.add('QuickLink__SearchPopup__results_list');
        this.search_results.setAttribute('style', `flex-direction: column;
         cursor: pointer;
         display:flex;
      `);
        return [this.search_field, this.search_results];
    }
    initHotKeys(resolve) {
        this.search_results.addEventListener('click', (e) => {
            if (!e.target.hasAttribute('wrapped_url')) {
                return;
            }
            document.removeEventListener('keyup', onKeyDown);
            const url = e.target.getAttribute(this.wrap_link ? 'wrapped_url' : 'url') || '';
            resolve(url);
        });
        const links = Array.from(this.search_results.querySelectorAll('span'));
        if (links.length === 0) {
            return;
        }
        let offset = 0;
        const select_current = () => { links[offset].parentElement?.setAttribute('style', SELECTED_A_STYLE); };
        const unselect_current = () => { links[offset].parentElement?.setAttribute('style', DEFAULT_A_STYLE); };
        const onKeyDown = (e) => {
            if (e.code === 'Enter') {
                document.removeEventListener('keyup', onKeyDown);
                const url = links[offset].getAttribute(this.wrap_link ? 'wrapped_url' : 'url') || '';
                resolve(url);
                return;
            }
            if (e.code !== 'ArrowDown' && e.code !== 'ArrowUp') {
                document.removeEventListener('keyup', onKeyDown);
                return;
            }
            e.preventDefault();
            unselect_current();
            if (e.code === 'ArrowDown') {
                offset += 1;
            }
            if (e.code === 'ArrowUp') {
                offset -= 1;
            }
            if (offset > links.length - 1) {
                offset -= links.length;
            }
            if (offset < 0) {
                offset += links.length;
            }
            select_current();
        };
        select_current();
        document.addEventListener('keyup', onKeyDown);
    }
}
const DEFAULT_A_STYLE = `
justify-content: space-between;
padding: 3px;
display: flex;
color: #111;`;
const SELECTED_A_STYLE = `
${DEFAULT_A_STYLE}
font-weight: 700;
background: #ddd;`;
const generateListItem = ({ title, url }) => `<div style="${DEFAULT_A_STYLE}">
      <span
         style="font-size: 16px; padding: 0 4px; flex-grow: 1;"
         url="${url}"
         wrapped_url="<a href='${url}'>${title}</a>">
         ${title}
      </span>
      <a href="${url}" target="blank">
         <img
            draggable="false"
            role="img"
            style="display: inline !important;
               border: none !important;
               box-shadow: none !important;
               height: 18px !important;
               width: 18px !important;
               margin: 0 2px !important;
               vertical-align: -0.1em !important;
               background: none !important;
               padding: 0 !important;"
            alt="↗️"
            src="https://s.w.org/images/core/emoji/13.0.1/svg/2197.svg">
      </a>
   </div>`;

class WordPressLinks extends DataSource {
    constructor(configs, request_interval) {
        super(Object.fromEntries(configs.map(({ shortcut }) => [shortcut, []])));
        this.request_interval = request_interval;
        this.settings = Object.fromEntries(configs.map((cfg) => [cfg.shortcut, cfg]));
    }
    get(shortcut, { wrap_link }) {
        const update = (query) => this.update(shortcut, query).then(() => this.data[shortcut]);
        return new SearchPopup(update, this.request_interval, wrap_link).show('');
    }
    async update(shortcut, query) {
        if (!query) {
            return Promise.resolve();
        }
        return this.load(shortcut, {
            url: createURL(this.settings[shortcut], query),
        });
    }
    onload(shortcut, data) {
        this.data[shortcut] = data.map(({ title, url }) => ({ title, url }));
    }
    static from(configs, request_interval) {
        const wpSettings = configs.filter(({ sourceType }) => sourceType === DATA_SOURCE_TYPE.WordPress);
        if (wpSettings.length === 0) {
            return null;
        }
        return new WordPressLinks(wpSettings, request_interval);
    }
}
const WP_API = '/wp-json/wp/v2/search?';
function createURL({ url, per_page, pages }, query) {
    return `${url}${WP_API}search=${query}&per_page=${per_page}&page=${pages}`;
}
const DEFAULT_SHORTCUT_CONFIG = {
    sourceType: DATA_SOURCE_TYPE.WordPress,
    url: 'https://wordpress.org/support/',
    shortcut: 'wpsupport:',
    per_page: 5,
    pages: 1
};
const EMPTY_SHORTCUT_CONFIG = {
    sourceType: DATA_SOURCE_TYPE.WordPress,
    shortcut: '',
    per_page: 5,
    pages: 1,
    url: '',
};

class DataStorage {
    constructor(sources) {
        this.sources = sources.filter((s) => s !== null);
    }
    async get(key, params) {
        return this.sources.find((source) => source.has(key))?.get(key, params)
            || Promise.reject(new Error('key is not found'));
    }
}

class Hack {
}

/**
 * At {@link https://helpscout.net/} user edits {@link EditableElement},
 * but value stores at the textarea and updates on user keyboard events.
 * After replacement we have to add new value at textarea forcibly
 * @class
 * @extends Hack
 */
class HelpscoutHack extends Hack {
    constructor(redactor) {
        super();
        this.el = null;
        if (redactor === document.querySelector('div.redactor_redactor.redactor_editor')) {
            this.el = document.querySelector('textarea.redactor');
        }
    }
    /**
     * @param value replaced text
     */
    apply(value) {
        if (this.el === null) {
            return;
        }
        this.el.value = value;
    }
}

//#region consts
const SYM = {
    HTML: { NB_SPACE: '&nbsp;', NEW_LINE: '<br>' },
    TXT: { NB_SPACE: '\u00a0', NEW_LINE: '\n' }
};
const SPACES = [' ', SYM.HTML.NB_SPACE, SYM.TXT.NB_SPACE];
const SEPARATORS = [...SPACES, SYM.TXT.NEW_LINE, SYM.HTML.NEW_LINE, '('];
//#endregion
function trimEnd(s) {
    return SPACES
        .reduce((str, space) => str.replace(new RegExp(space, 'g'), ' '), s)
        .trimEnd();
}
function convertToHTML(s) {
    return convertStringFrom(SYM.TXT, SYM.HTML, s);
}
function convertToTXT(s) {
    return convertStringFrom(SYM.HTML, SYM.TXT, s)
        .replace(/\u200b/g, '')
        .replace(/<([a-z,\/]+)>/gi, '');
}
function convertStringFrom(replaceble, replace, s) {
    return Object
        .entries(replaceble)
        .reduce((s, [k, v]) => s.replace(new RegExp(v, 'g'), replace[k]), s);
}
function getLastWord(s) {
    if (!s) {
        return '';
    }
    /** Remove invisible symbols and tags */
    const txt = trimEnd(convertToTXT(s));
    const f = (s, sep) => s?.split(sep).reverse().find((w) => w !== '') || '';
    return SEPARATORS.reduce(f, txt);
}
function replaceLastWord(s, data, params = {}) {
    const key = getLastWord(s);
    return data.get(key, params).then((value) => s.slice(0, s.lastIndexOf(key)) +
        value +
        s.slice(s.lastIndexOf(key) + key.length)).catch(() => s);
}

class CustomElement {
    constructor(el) {
        this.el = el;
        this.value = '';
    }
    applyHacks(hacks) {
        hacks.forEach((hack) => { hack.apply(this.value); });
    }
}
const CURSOR_MARKER = '{CURSOR}';

class EditableElement extends CustomElement {
    static from(el) {
        if (!EditableElement.is(el)) {
            return null;
        }
        return new EditableElement(el);
    }
    static is(el) {
        return el?.isContentEditable;
    }
    async replace(data) {
        const range = window.getSelection()?.getRangeAt(0);
        const html = await this.replaceNodeContent(data, range);
        this.el.innerHTML = typeof html === 'string' ? html || this.el.innerHTML : await this.replaceSelectedContent(data, range);
        this.setCaret();
        this.value = this.el.innerHTML;
    }
    async replaceNodeContent(data, range) {
        const node = range?.endContainer;
        if (node === this.el) {
            return Promise.resolve(null);
        }
        const value = node?.innerHTML
            || node?.nodeValue
            || node?.previousElementSibling?.innerHTML
            || node?.previousSibling?.nodeValue;
        if (!value || !trimEnd(value)) {
            return Promise.resolve('');
        }
        const replaced = await replaceLastWord(value, data);
        if (replaced === value) {
            this.setCursorMarket(node, range);
            return Promise.resolve(this.el.innerHTML);
        }
        const no_marker = !replaced.includes(CURSOR_MARKER);
        return this.el.innerHTML.replace(convertToHTML(value).trimEnd(), `${convertToHTML(replaced).trimEnd()}${no_marker ? CURSOR_MARKER : ''}`);
    }
    async replaceSelectedContent(data, range) {
        range && range.setStart(this.el, 0);
        const replaced = await replaceLastWord(this.getSelection(range).innerHTML, data);
        const no_marker = !replaced.includes(CURSOR_MARKER);
        range && range.deleteContents();
        return `${convertToHTML(replaced.trimEnd())}${no_marker ? CURSOR_MARKER : ''}${this.el.innerHTML}`;
    }
    setCaret() {
        const cursorNode = findNodeIncludes(this.el, CURSOR_MARKER);
        const pos = cursorNode?.textContent?.indexOf(CURSOR_MARKER) || 0;
        if (!cursorNode) {
            return;
        }
        cursorNode.textContent = cursorNode.textContent?.replace(new RegExp(CURSOR_MARKER, 'gi'), '') || '';
        const range = document.createRange();
        range.setStart(cursorNode, pos);
        range.collapse(true);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
    }
    setCursorMarket(node, range) {
        if (node?.innerText) {
            const endSelection = this.getSelection(range).innerText.length || this.getSelection(range).innerHTML.length;
            node.innerText = node.innerText.substring(0, endSelection + 1)
                + CURSOR_MARKER
                + node.innerText.substring(endSelection + 1);
            return;
        }
        if (node?.nodeValue) {
            const endSelection = range?.endOffset || this.getSelection(range).innerText.length;
            node.nodeValue = node.nodeValue?.substring(0, endSelection)
                + CURSOR_MARKER
                + node.nodeValue?.substring(endSelection);
        }
    }
    getSelection(range) {
        range && range.setStart(this.el, 0);
        const clonedSelection = range && range.cloneContents();
        const div = document.createElement('div');
        clonedSelection && div.appendChild(clonedSelection);
        return div;
    }
}
/**
 * Looking for Node with substring recursively
 */
function findNodeIncludes(node, s) {
    if (node.nodeValue?.includes(s)) {
        return node;
    }
    const children = Array.from(node.childNodes);
    if (children.length === 0) {
        return null;
    }
    for (const child of children) {
        const node = findNodeIncludes(child, s);
        if (node) {
            return node;
        }
    }
    return null;
}

class InputableElement extends CustomElement {
    static from(el) {
        if (!InputableElement.is(el)) {
            return null;
        }
        return new InputableElement(el);
    }
    async replace(data) {
        const selected = this.el.value.slice(0, this.el.selectionEnd || void 0);
        const replaced = await replaceLastWord(selected, data, { wrap_link: /textarea/i.test(this.el.nodeName) });
        const not_selected = this.el.value.slice(this.el.selectionEnd || void 0);
        const no_marker = !replaced.includes(CURSOR_MARKER);
        this.el.value = `${replaced}${no_marker ? CURSOR_MARKER : ''}${not_selected}`;
        this.setCaret();
        this.value = this.el.value;
    }
    setCaret() {
        const index = this.el.value.indexOf(CURSOR_MARKER);
        this.el.value = this.el.value.replace(new RegExp(CURSOR_MARKER, 'g'), '');
        this.el.setSelectionRange(index, index);
    }
    static is(element) {
        if (element == null || element.nodeType !== 1) {
            return false;
        }
        return /textarea/i.test(element.nodeName) ||
            /input/i.test(element.nodeName) &&
                /^(?:text|email|number|search|tel|url|password)$/i.test(element.type);
    }
}

function start({ origins } = DEFAULT_APP_CONFIG) {
    return origins.length === 0 || origins.some((origin) => location.href.includes(origin));
}
function isReplacable(el) {
    return el.getAttribute('datas-replace') !== 'disable';
}
const DEFAULT_APP_CONFIG = {
    origins: [],
    request_interval: 500
};

class UserStorage {
    constructor({ onUpdate } = { onUpdate: () => void 0 }) {
        this.applySettings = this.applySettings.bind(this);
        this.onUpdate = onUpdate;
    }
    getSettings() {
        return new Promise((res, _) => {
            // @ts-ignore
            chrome.storage.sync.get('settings', (data) => {
                res(data && data.settings);
            });
        }).then((settings) => settings ? JSON.parse(settings) : DEFAULT_SETTINGS);
    }
    ;
    async applySettings(settings) {
        if (!settings) {
            throw new Error('Settings formatted incorrectly');
        }
        await this.saveSettings(settings);
        this.onUpdate(settings);
    }
    saveSettings(settings) {
        return new Promise((res, _) => {
            // @ts-ignore
            chrome.storage.sync.set({ settings }, res);
        });
    }
}
const DEFAULT_SETTINGS = {
    application: DEFAULT_APP_CONFIG,
    shortcuts: [DEFAULT_SHORTCUT_CONFIG]
};

(async function () {
    const storage = new UserStorage();
    const settings = await storage.getSettings();
    if (!start(settings.application)) {
        return;
    }
    const data = new DataStorage([WordPressLinks.from(settings.shortcuts, settings.application.request_interval)]);
    document.addEventListener('keyup', onKeyUp);
    async function onKeyUp(e) {
        if (e.code !== 'Space' && e.key !== 'Enter' || !isReplacable(e.target)) {
            return;
        }
        const element = EditableElement.from(e.target) || InputableElement.from(e.target);
        if (element === null) {
            return;
        }
        await element.replace(data);
        element.applyHacks([new HelpscoutHack(element.el)]);
    }
})();
