export default abstract class Popup<T> {
   protected update: (v: string) => Promise<void>;
   protected el?: HTMLDivElement;

   constructor(update: (v: string) => Promise<T>, protected request_interval: number) {
      this.update = (v: string) => update(v).then(this.updateContent);
   }

   show(data: string): Promise<string> {
      return new Promise((resolve, reject) => {
         const [onKeyUp] = this.listenPopupCloseEvents(resolve, reject);
         this.el = this.createPopupElement(this.getContent(data));
         this.el.addEventListener('keyup', onKeyUp);
         document.body.appendChild(this.el);
         this.listenUserActions().then(resolve, reject);
      });
   }

   close() {
      this.el?.remove();
   }

   private listenPopupCloseEvents(resolve: (v: string) => void, reject: (e: Error) => void) {
      const dispose = () => {
         document.removeEventListener('click', onClickOutSide);
         this.close();
         reject(new Error('No value'));
      };
      const onClickOutSide = (e: MouseEvent) => {
         if (this.el && e.composedPath().includes(this.el)) { return; }
         dispose();
      };
      document.addEventListener('click', onClickOutSide);

      const onKeyUp = (e: KeyboardEvent) => {
         if (e.code !== 'Escape') { return; }
         e.stopPropagation();
         dispose();
      };
      document.addEventListener('keyup', onKeyUp);
      return [onKeyUp];
   }

   protected listenUserActions = () => Promise.resolve('');

   protected createPopupElement(html: HTMLElement[]): HTMLDivElement {
      const div = document.createElement('div');
      div.setAttribute('style', `
         background: #eee;
         border: 1px solid #ccc;
         border-radius: 5px;
         position: absolute;
         max-height: 200px;
         max-width: 500px;
         z-index: 99999;
         padding: 10px;
         margin: auto;
         bottom: 0;
         right: 0;
         left: 0;
         top: 0;
      `);
      html.forEach((child) => { div.appendChild(child); });
      return div;
   }

   protected abstract getContent(data: string): HTMLElement[];
   protected abstract updateContent(data: T): void;
}
