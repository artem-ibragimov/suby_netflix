import { IApplicationConfig, DEFAULT_APP_CONFIG } from '~/App/start';
import { DATA_SOURCE_TYPE, DATA_SOURCE_TYPES } from '~/Data/Source/const';
import { IShortcutConfig, DEFAULT_SHORTCUT_CONFIG, EMPTY_SHORTCUT_CONFIG } from '~/Data/Source/WordPressLinks';

export class LinksEditor {
   constructor(
      private container: HTMLDivElement,
      private addBtn: HTMLButtonElement
   ) {
      this.renderFields = this.renderFields.bind(this);
      this.createEmptyField = this.createEmptyField.bind(this);
      this.addBtn.addEventListener('click', this.createEmptyField);
      this.container.addEventListener('click', removeShortCut);
   }

   render(configs: IShortcutConfig[]) {
      this.removeFields();
      if (configs.length === 0) {
         this.renderFields(DEFAULT_SHORTCUT_CONFIG);
         return;
      }
      configs.forEach(this.renderFields);
   }

   getSettings(): IShortcutConfig[] {
      const configs: IShortcutConfig[] = Array
         .from(this.container.querySelectorAll('div.shortcut_fields'))
         .map<IShortcutConfig>((fields: Element) =>
            Array
               .from(fields.querySelectorAll<HTMLInputElement>('[data]'))
               .map<Partial<IShortcutConfig>>((input) =>
                  ({ [input.getAttribute('data') as keyof IShortcutConfig]: input.value as IShortcutConfig[keyof IShortcutConfig] })
               )
               .reduce<IShortcutConfig>((prev, cfg) => ({ ...prev, ...cfg }), EMPTY_SHORTCUT_CONFIG)
         ).filter(({ shortcut }) => shortcut !== '');
      return configs;
   };

   private removeFields() {
      this.container
         .querySelectorAll('div.shortcut_fields')
         .forEach((el) => { el.remove(); });
   }

   private createEmptyField() {
      this.renderFields({ per_page: 5, pages: 1 });
   }

   private renderFields(
      cfg?: Partial<IShortcutConfig>,
   ) {
      const shortcutEl = createFieldContainer([
         this.createTypeSelect(DATA_SOURCE_TYPES, cfg?.sourceType),
         ...this.createLinkParams(cfg),
         createRemoveBtn()
      ]);
      shortcutEl.classList.add('shortcut_fields');
      this.container.appendChild(shortcutEl);
   }


   private createTypeSelect(options: DATA_SOURCE_TYPE[], selectedDataSourceType?: DATA_SOURCE_TYPE) {
      const selectLinkType = document.createElement('select');
      selectLinkType.setAttribute('data', 'dataSourceType');
      options
         .map((link_type) => {
            const option = document.createElement('option');
            option.innerText = link_type;
            if (link_type === selectedDataSourceType) { option.selected = true; }
            return option;
         }).forEach((option) => {
            selectLinkType.appendChild(option);
         });

      return selectLinkType;
   }

   private createLinkParams({ shortcut, url, per_page }: Partial<IShortcutConfig> = {}) {
      const shortcutEl = document.createElement('input');
      shortcutEl.setAttribute('data', 'shortcut');
      shortcutEl.setAttribute('placeholder', 'shortcut, e.x link:');
      shortcutEl.setAttribute('type', 'text');
      if (shortcut) { shortcutEl.value = shortcut; }

      const urlEl = document.createElement('input');
      urlEl.setAttribute('data', 'url');
      urlEl.setAttribute('placeholder', 'url, e.x. https://wordpress.org/');
      urlEl.setAttribute('type', 'url');
      if (url) { urlEl.value = url; }

      const perPageEl = document.createElement('input');
      perPageEl.setAttribute('data', 'per_page');
      perPageEl.setAttribute('placeholder', 'Links per page');
      perPageEl.setAttribute('type', 'number');
      perPageEl.setAttribute('max', '10');
      perPageEl.setAttribute('min', '1');
      if (per_page) { perPageEl.value = `${per_page}`; }
      return [shortcutEl, urlEl, perPageEl];
   }
}

export class AppConfigEditor {
   constructor(
      private container: HTMLDivElement,
   ) {
      this.renderParams = this.renderParams.bind(this);
      this.createEmptyField = this.createEmptyField.bind(this);
      this.container.addEventListener('click', removeShortCut);
   }

   render(cfg: IApplicationConfig) {
      this.removeFields();
      this.renderParams(cfg);
   }

   getSettings(): IApplicationConfig {
      const origins_el = this.container.querySelector<HTMLInputElement>('[data=origins]');
      const origins = origins_el?.value
         .split('\n')
         .map((origin) => origin.trim())
         .filter((origin) => origin !== '')
         || DEFAULT_APP_CONFIG.origins;

      const request_interval_el = this.container.querySelector<HTMLInputElement>('[data=request_interval]');
      const request_interval = request_interval_el?.value && parseInt(request_interval_el.value, 10) || DEFAULT_APP_CONFIG.request_interval;
      return { origins, request_interval };
   };

   private removeFields() {
      this.container
         .querySelectorAll('div.application_fields')
         .forEach((el) => { el.remove(); });
   }

   private createEmptyField() {
      this.renderParams(DEFAULT_APP_CONFIG);
   }

   private renderParams(cfg: IApplicationConfig) {
      const applicationEl = createFieldContainer(this.createAppParams(cfg));
      applicationEl.classList.add('application_fields');
      this.container.appendChild(applicationEl);
   }

   private createAppParams({ origins }: IApplicationConfig) {
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

function removeShortCut(e: MouseEvent) {
   if (!(e.target as HTMLButtonElement)?.classList.contains('remove_button')) { return; }
   (e.target as HTMLButtonElement).parentElement?.remove();
}

function createFieldContainer(childs: HTMLElement[]) {
   const div = document.createElement('div');
   div.classList.add('flex', 'full_width', 'content-end', 'padding-top');
   childs.forEach((c) => { div.appendChild(c); });
   return div;
}
