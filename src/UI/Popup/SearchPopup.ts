import Popup from '~/UI/Popup/Base';
type IData = { title: string, url: string; }[];
export default class SearchPopup extends Popup<IData> {
   search_fied!: HTMLInputElement;
   search_results!: HTMLDivElement;

   protected getContent() {
      this.search_fied = document.createElement('input');
      this.search_fied.classList.add('QuickLink__SearchPopup__search_field');
      this.search_fied.setAttribute('data-replace', 'disable');
      this.search_fied.setAttribute('autofocus', 'true');
      this.search_fied.setAttribute('placeholder', 'Search links');
      this.search_fied.setAttribute('style',
         `display: block;
         width: 100%;
         font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
         letter-spacing: .01em;
         height: 2.25em;
         border: 1px solid #ccc;
         box-shadow: inset 0 1px 3px #ddd;
         box-sizing: border-box;
         border-radius: 3px;
         text-transform: none;
         font-size: 100%;
         line-height: 1.15;
         margin-right: 5px;
         padding: 4px; `
      );

      this.search_results = document.createElement('div');
      this.search_results.classList.add('QuickLink__SearchPopup__results_list');
      this.search_results.setAttribute('style', `display:flex; flex-direction: column; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;`);

      return [this.search_fied, this.search_results];
   }

   protected updateContent = (data: IData) => {
      if (!this.search_results) { return; }
      this.search_results.innerHTML = data.map(generateListItem).join('\n');
   };

   protected timeoutID!: NodeJS.Timeout;

   protected listenUserActions = () => new Promise((resolve: (v: string) => void) => {
      if (!this.search_fied) { return resolve(''); }
      let prev_value = '';
      this.search_fied.addEventListener('keyup', (e: KeyboardEvent) => {
         if (this.search_fied.value === prev_value) { return; }
         prev_value = this.search_fied.value;
         clearTimeout(this.timeoutID);
         this.timeoutID = setTimeout(() => {
            this.update(this.search_fied.value).then(() => { this.initHotKeys(resolve); });
         }, this.request_interval);
      });
      this.search_fied?.focus();
   }).then((v) => {
      this.close();
      return v;
   });

   protected initHotKeys(resolve: (v: string) => void) {
      this.search_results.addEventListener('click', (e: MouseEvent) => {
         if (!(e.target as HTMLElement).hasAttribute('data')) { return; };
         document.removeEventListener('keyup', onKeyDown);
         resolve((e.target as HTMLElement).getAttribute('data') || '');
      });

      const links = Array.from(this.search_results.querySelectorAll('span'));
      if (links.length === 0) { return; }
      let offset = 0;
      const select_current = () => { links[offset].setAttribute('style', SELECTED_A_STYLE); };
      const unselect_current = () => { links[offset].setAttribute('style', DEFAULT_A_STYLE); };

      select_current();
      document.addEventListener('keyup', onKeyDown);


      function onKeyDown(e: KeyboardEvent) {
         if (e.code === 'Enter') {
            document.removeEventListener('keyup', onKeyDown);
            resolve(links[offset].getAttribute('data') || '');
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
   }
}

const DEFAULT_A_STYLE = `
font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
justify-content: space-between;
font-size: 1.1em;
cursor: pointer;
display: flex;
padding: 4px;
color: #222;
`;
const SELECTED_A_STYLE = DEFAULT_A_STYLE + 'font-weight: 500; background: #ddd; color:#000;';
const generateListItem = ({ title, url }: { title: string, url: string; }) =>
   `<div style="${DEFAULT_A_STYLE}" >
      <span style="flex-grow:1" data="<a href='${url}'>${title}</a>">${title}</span>
      <a href="${url}" target="blank">↗️</a>
   </div>`;