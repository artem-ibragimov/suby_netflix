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

class LinksEditor {
    constructor(container, addBtn) {
        this.container = container;
        this.addBtn = addBtn;
        this.renderFields = this.renderFields.bind(this);
        this.createEmptyField = this.createEmptyField.bind(this);
        this.addBtn.addEventListener('click', this.createEmptyField);
        this.container.addEventListener('click', removeShortCut);
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
            .forEach((el) => { el.remove(); });
    }
    createEmptyField() {
        this.renderFields({ per_page: 5, pages: 1 });
    }
    renderFields(cfg) {
        const shortcutEl = createFieldContainer([
            this.createTypeSelect(DATA_SOURCE_TYPES, cfg?.sourceType),
            ...this.createLinkParams(cfg),
            createRemoveBtn()
        ]);
        shortcutEl.classList.add('shortcut_fields');
        this.container.appendChild(shortcutEl);
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
        }).forEach((option) => {
            selectLinkType.appendChild(option);
        });
        return selectLinkType;
    }
    createLinkParams({ shortcut, url, per_page } = {}) {
        const shortcutEl = document.createElement('input');
        shortcutEl.setAttribute('data', 'shortcut');
        shortcutEl.setAttribute('placeholder', 'shortcut, e.x link:');
        shortcutEl.setAttribute('type', 'text');
        if (shortcut) {
            shortcutEl.value = shortcut;
        }
        const urlEl = document.createElement('input');
        urlEl.setAttribute('data', 'url');
        urlEl.setAttribute('placeholder', 'url, e.x. https://wordpress.org/');
        urlEl.setAttribute('type', 'url');
        if (url) {
            urlEl.value = url;
        }
        const perPageEl = document.createElement('input');
        perPageEl.setAttribute('data', 'per_page');
        perPageEl.setAttribute('placeholder', 'Links per page');
        perPageEl.setAttribute('type', 'number');
        perPageEl.setAttribute('max', '10');
        perPageEl.setAttribute('min', '1');
        if (per_page) {
            perPageEl.value = `${per_page}`;
        }
        return [shortcutEl, urlEl, perPageEl];
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
    e.target.parentElement?.remove();
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
