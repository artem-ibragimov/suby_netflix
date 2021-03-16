'use strict';

class DnD {
    constructor(selector) {
        this._ref = document.querySelector(selector);
        if (!this._ref) {
            throw new Error(`Element with selector ${selector} not found`);
        }
        this._ref.addEventListener('dragover', (event) => {
            if (!event.dataTransfer) {
                return;
            }
            event.stopPropagation();
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
        });
    }
    onFileDropped(callback) {
        this._ref?.addEventListener('drop', (event) => {
            if (!event.dataTransfer) {
                return;
            }
            event.stopPropagation();
            event.preventDefault();
            const fileList = event.dataTransfer.files;
            const reader = new FileReader();
            reader.addEventListener('loadend', (event) => {
                try {
                    const content = JSON.parse(event.target?.result);
                    callback(content);
                }
                catch (e) {
                    alert("Incorrect file: " + e.message);
                }
            });
            reader.readAsText(fileList[0]);
        });
    }
}

function saveToFile(data, fileName) {
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.setAttribute('style', 'display: none');
    const json = JSON.stringify(data, null, 4);
    const blob = new Blob([json], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
}

const DEFAULT_APP_CONFIG = {
    origins: [],
    request_interval: 500
};

var DATA_SOURCE_TYPE;
(function (DATA_SOURCE_TYPE) {
    DATA_SOURCE_TYPE["WordPress"] = "WordPress";
})(DATA_SOURCE_TYPE || (DATA_SOURCE_TYPE = {}));
const DATA_SOURCE_TYPES = [DATA_SOURCE_TYPE.WordPress];

class DataSource {
    constructor(default_data) {
        this.default_data = default_data;
        this.onerror = this.onerror.bind(this);
        this.onload = this.onload.bind(this);
        this.data = default_data;
    }
    async load(shortcut, request_options) {
        return DataSource.request(request_options)
            .then((data) => this.onload(shortcut, data))
            .catch(this.onerror);
    }
    static request(request_options) {
        return new Promise((resolve) => {
            // @ts-ignore
            chrome.runtime.sendMessage({
                url: request_options.url,
                options: request_options
            }, resolve);
        }).then((res) => {
            if (Object.keys(res).length === 0) {
                throw new Error('Failed to load');
            }
            return res;
        });
    }
    has(shortcut) {
        return shortcut in this.data;
    }
    onerror(e) {
        this.data = this.default_data;
        console.error(e);
    }
}

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

const WP_API = '/wp-json/wp/v2/search?';
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
            url: WordPressLinks.createURL(this.settings[shortcut], query),
        });
    }
    static createURL({ url, per_page, pages }, query) {
        return `${url}${WP_API}search=${query}&per_page=${per_page}&page=${pages}`;
    }
    static checkURL(url) {
        return DataSource.request({
            url: this.createURL({ ...EMPTY_SHORTCUT_CONFIG, url }, ''),
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

var COLOR;
(function (COLOR) {
    COLOR["GREEN"] = "#f0fff0";
    COLOR["RED"] = "#ffe7e7";
})(COLOR || (COLOR = {}));
function highlight(el, color) {
    el.style.background = color;
}

function init(el) {
    const guid = `tooltip_${Math.random().toPrecision(7).replace('.', '')}`;
    const span = document.createElement('span');
    span.setAttribute('hidden', 'true');
    span.classList.add('tooltiptext', guid);
    el.classList.add('tooltip', guid);
    document.body.appendChild(span);
}
function show(el, tooltip) {
    const span = findTooltip(el);
    if (!span) {
        return;
    }
    span.innerHTML = tooltip;
    span.removeAttribute('hidden');
    span.setAttribute('style', `top: ${el.offsetTop + el.clientHeight + 6}px;
      left: ${el.offsetLeft}px;
      width: ${el.offsetWidth}px;`);
}
function hide(el) {
    const span = findTooltip(el);
    if (!span) {
        return;
    }
    span.setAttribute('hidden', 'true');
}
function remove(el) {
    const span = findTooltip(el);
    if (!span) {
        return;
    }
    span.remove();
}
function findTooltip(el) {
    const guid = Array.from(el.classList.values()).find((c) => c.includes('tooltip_'));
    if (!guid) {
        return;
    }
    return document.querySelector(`span.${guid}`);
}

class LinksEditor {
    constructor(container, addBtn) {
        this.container = container;
        this.addBtn = addBtn;
        this.renderFields = this.renderFields.bind(this);
        this.onFieldInput = this.onFieldInput.bind(this);
        this.createEmptyField = this.createEmptyField.bind(this);
        this.addBtn.addEventListener('click', this.createEmptyField);
        this.container.addEventListener('click', removeShortCut);
        this.container.addEventListener('input', this.onFieldInput);
    }
    render(configs) {
        this.removeFields();
        if (configs.length === 0) {
            this.renderFields(DEFAULT_SHORTCUT_CONFIG);
            return;
        }
        configs.forEach(this.renderFields);
    }
    getSettings() {
        const configs = Array
            .from(this.container.querySelectorAll('div.shortcut_fields'))
            .map((fields) => Array
            .from(fields.querySelectorAll('[data]'))
            .map((input) => ({ [input.getAttribute('data')]: input.value }))
            .reduce((prev, cfg) => ({ ...prev, ...cfg }), EMPTY_SHORTCUT_CONFIG)).filter(({ shortcut }) => shortcut !== '');
        return configs;
    }
    ;
    removeFields() {
        this.container
            .querySelectorAll('div.shortcut_fields')
            .forEach((el) => {
            remove(el);
            el.remove();
        });
    }
    createEmptyField() {
        this.renderFields({ per_page: 5, pages: 1 });
    }
    renderFields(cfg) {
        const [shortcutEl, urlEl, perPageEl] = this.createLinkParams(cfg);
        const fieldContainer = createFieldContainer([
            this.createTypeSelect(DATA_SOURCE_TYPES, cfg?.sourceType),
            shortcutEl, urlEl, perPageEl,
            createRemoveBtn()
        ]);
        init(urlEl);
        this.validateFieldContainer(fieldContainer);
        fieldContainer.classList.add('shortcut_fields');
        this.container.appendChild(fieldContainer);
    }
    createTypeSelect(options, selectedDataSourceType) {
        const selectLinkType = document.createElement('select');
        selectLinkType.setAttribute('data', 'dataSourceType');
        options
            .map((link_type) => {
            const option = document.createElement('option');
            option.innerText = link_type;
            if (link_type === selectedDataSourceType) {
                option.selected = true;
            }
            return option;
        })
            .forEach((option) => { selectLinkType.appendChild(option); });
        return selectLinkType;
    }
    createLinkParams({ shortcut, url, per_page } = {}) {
        const shortcutEl = document.createElement('input');
        shortcutEl.setAttribute('data', 'shortcut');
        shortcutEl.setAttribute('placeholder', 'shortcut, e.x link:');
        shortcutEl.setAttribute('type', 'text');
        shortcutEl.classList.add('smooth');
        if (shortcut) {
            shortcutEl.value = shortcut;
        }
        const urlEl = document.createElement('input');
        urlEl.setAttribute('data', 'url');
        urlEl.setAttribute('placeholder', 'url, e.x. https://wordpress.org/');
        urlEl.setAttribute('type', 'url');
        urlEl.classList.add('smooth');
        if (url) {
            urlEl.value = url;
        }
        const perPageEl = document.createElement('input');
        perPageEl.setAttribute('data', 'per_page');
        perPageEl.setAttribute('placeholder', 'Links per page');
        perPageEl.setAttribute('type', 'number');
        perPageEl.setAttribute('max', '10');
        perPageEl.setAttribute('min', '1');
        perPageEl.classList.add('smooth');
        if (per_page) {
            perPageEl.value = `${per_page}`;
        }
        return [shortcutEl, urlEl, perPageEl];
    }
    onFieldInput(e) {
        const field = e.target;
        const data_type = field.getAttribute('data');
        if (data_type !== 'url' && data_type !== 'dataSourceType') {
            return;
        }
        this.validateFieldContainer(field.parentElement);
    }
    validateFieldContainer(container) {
        if (!container) {
            return;
        }
        const sourceType_field = container.querySelector('[data=dataSourceType]');
        const url_field = container.querySelector('[data=url]');
        if (sourceType_field.value !== DATA_SOURCE_TYPE.WordPress || !url_field.value) {
            return;
        }
        WordPressLinks.checkURL(url_field.value)
            .then(() => {
            highlight(url_field, COLOR.GREEN);
            hide(url_field);
        })
            .catch(() => {
            highlight(url_field, COLOR.RED);
            show(url_field, 'The URL does not use the WordPress REST API');
        });
    }
}
class AppConfigEditor {
    constructor(container) {
        this.container = container;
        this.renderParams = this.renderParams.bind(this);
        this.createEmptyField = this.createEmptyField.bind(this);
        this.container.addEventListener('click', removeShortCut);
    }
    render(cfg) {
        this.removeFields();
        this.renderParams(cfg);
    }
    getSettings() {
        const origins_el = this.container.querySelector('[data=origins]');
        const origins = origins_el?.value
            .split('\n')
            .map((origin) => origin.trim())
            .filter((origin) => origin !== '')
            || DEFAULT_APP_CONFIG.origins;
        const request_interval_el = this.container.querySelector('[data=request_interval]');
        const request_interval = request_interval_el?.value && parseInt(request_interval_el.value, 10) || DEFAULT_APP_CONFIG.request_interval;
        return { origins, request_interval };
    }
    ;
    removeFields() {
        this.container
            .querySelectorAll('div.application_fields')
            .forEach((el) => { el.remove(); });
    }
    createEmptyField() {
        this.renderParams(DEFAULT_APP_CONFIG);
    }
    renderParams(cfg) {
        const applicationEl = createFieldContainer(this.createAppParams(cfg));
        applicationEl.classList.add('application_fields');
        this.container.appendChild(applicationEl);
    }
    createAppParams({ origins }) {
        const origin_el = document.createElement('textarea');
        origin_el.setAttribute('data', 'origins');
        origin_el.setAttribute('placeholder', 'use one line per URL');
        origin_el.setAttribute('type', 'text');
        origin_el.value = origins.join('\n');
        return [origin_el];
    }
}
function createRemoveBtn() {
    const btn = document.createElement('button');
    btn.classList.add('remove_button', 'small_width');
    btn.innerHTML = 'x';
    return btn;
}
function removeShortCut(e) {
    if (!e.target?.classList.contains('remove_button')) {
        return;
    }
    const root = e.target.parentElement;
    if (!root) {
        return;
    }
    root.querySelectorAll('input').forEach((child) => { remove(child); });
    root.remove();
}
function createFieldContainer(childs) {
    const div = document.createElement('div');
    div.classList.add('flex', 'full_width', 'content-end', 'padding-top');
    childs.forEach((c) => { div.appendChild(c); });
    return div;
}

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
    const appContainerEl = document.querySelector('#applicationContainer');
    const appEditor = new AppConfigEditor(appContainerEl);
    const shortcutContainerEl = document.querySelector('#shortcutsContainer');
    const addBtn = document.querySelector('#addShortcut');
    const linksEditor = new LinksEditor(shortcutContainerEl, addBtn);
    const onUpdate = (s) => {
        const { application, shortcuts } = JSON.parse(s);
        appEditor.render(application);
        linksEditor.render(shortcuts);
    };
    const storage = new UserStorage({ onUpdate });
    window.onunload = () => {
        const settings = {
            application: appEditor.getSettings(),
            shortcuts: linksEditor.getSettings()
        };
        storage.applySettings(JSON.stringify(settings));
    };
    const dnd = new DnD('#drop-area');
    dnd.onFileDropped(storage.applySettings);
    const downloadBtn = document.querySelector('#download');
    downloadBtn.onclick = () => {
        const settings = {
            application: appEditor.getSettings(),
            shortcuts: linksEditor.getSettings()
        };
        saveToFile(JSON.stringify(settings), 'QuickLinkSettings.json');
    };
    const settings = await storage.getSettings();
    appEditor.render(settings.application);
    linksEditor.render(settings.shortcuts);
})();
