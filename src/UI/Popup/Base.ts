export default abstract class Popup<T> {
   protected update: (v: string) => Promise<void>;
   protected overlay?: HTMLDivElement;
   protected popup?: HTMLDivElement;

   constructor(update: (v: string) => Promise<T>, protected request_interval: number) {
      this.update = (v: string) => update(v).then(this.updateContent);
   }

   show(data: string): Promise<string> {
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

   private listenPopupCloseEvents(resolve: (v: string) => void, reject: (e: Error) => void) {
      const dispose = () => {
         document.removeEventListener('click', onClickOutSide);
         this.close();
         reject(new Error('No value'));
      };
      const onClickOutSide = (e: MouseEvent) => {
         if (this.popup && e.composedPath().includes(this.popup)) { return; }
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

   private createOverlayElement(): HTMLDivElement {
      const overlay = document.createElement('div');
      overlay.setAttribute('style',
         `justify-content: center;
         align-items: center;
         position: fixed;
         z-index: 99999;
         display: flex;
         bottom: 0;
         right: 0;
         left: 0;
         top: 0;
         `);
      return overlay;
   }
   private createPopupElement(html: HTMLElement[]): HTMLDivElement {
      const popup = document.createElement('div');
      popup.setAttribute('style',
         `
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

   protected abstract getContent(data: string): HTMLElement[];
   protected abstract updateContent(data: T): void;
}
