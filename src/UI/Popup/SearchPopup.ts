import Popup from '~/UI/Popup/Base';
type IData = { title: string, url: string; }[];
export default class SearchPopup extends Popup<IData> {
   search_field!: HTMLInputElement;
   search_results!: HTMLDivElement;

   protected getContent() {
      this.search_field = document.createElement('input');
      this.search_field.classList.add('QuickLink__SearchPopup__search_field');
      this.search_field.setAttribute('data-replace', 'disable');
      this.search_field.setAttribute('autofocus', 'true');
      this.search_field.setAttribute('placeholder', 'Search links');
      this.search_field.setAttribute('style',
         `
         margin: 0 !important;
         height: 25px;
         width: 100%;
         box-shadow: inset 0 1px 3px #ddd;
         letter-spacing: .01em;
         border: 1px solid #ccc;
         box-sizing: border-box;
         border-radius: 3px;
         text-transform: none;
         padding: 4px; `
      );

      this.search_results = document.createElement('div');
      this.search_results.classList.add('QuickLink__SearchPopup__results_list');
      this.search_results.setAttribute('style',
         `flex-direction: column;
         cursor: pointer;
         display:flex;
      `);

      return [this.search_field, this.search_results];
   }

   protected updateContent = (data: IData) => {
      if (!this.search_results) { return; }
      this.search_results.innerHTML = data.map(generateListItem).join('\n');
   };

   protected timeoutID!: NodeJS.Timeout;

   protected listenUserActions = () => new Promise((resolve: (v: string) => void) => {
      if (!this.search_field) { return resolve(''); }
      let prev_value = '';
      this.search_field.addEventListener('keyup', (e: KeyboardEvent) => {
         if (this.search_field.value === prev_value) { return; }
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

   protected initHotKeys(resolve: (v: string) => void) {
      this.search_results.addEventListener('click', (e: MouseEvent) => {
         if (!(e.target as HTMLElement).hasAttribute('wrapped_url')) { return; };
         document.removeEventListener('keyup', onKeyDown);
         const url = (e.target as HTMLElement).getAttribute(this.wrap_link ? 'wrapped_url' : 'url') || '';
         resolve(url);
      });

      const links = Array.from(this.search_results.querySelectorAll('span'));
      if (links.length === 0) { return; }
      let offset = 0;
      const select_current = () => { links[offset].parentElement?.setAttribute('style', SELECTED_A_STYLE); };
      const unselect_current = () => { links[offset].parentElement?.setAttribute('style', DEFAULT_A_STYLE); };
      const onKeyDown = (e: KeyboardEvent) => {
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
         if (e.code === 'ArrowDown') { offset += 1; };
         if (e.code === 'ArrowUp') { offset -= 1; }
         if (offset > links.length - 1) { offset -= links.length; }
         if (offset < 0) { offset += links.length; }
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

const generateListItem = ({ title, url }: { title: string, url: string; }) =>
   `<div style="${DEFAULT_A_STYLE}">
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