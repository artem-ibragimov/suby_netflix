import { EventBus } from 'src/core/EventBus';
import { SubsComponent, IVisibleState } from 'src/components/player/Subs';

export class PlayerComponent extends EventBus<Action, IEvent>{
   private _video_el!: HTMLVideoElement | null;
   private container?: HTMLDivElement;
   private warn_caption?: HTMLParagraphElement;
   private primary_caption?: HTMLParagraphElement;
   private secondary_caption?: HTMLParagraphElement;
   private subs: SubsComponent;
   constructor(
      private video_el_selector: string,
   ) {
      super();
      this.state_change = this.state_change.bind(this);
      this.check_video_el = this.check_video_el.bind(this);
      this.subs = new SubsComponent(this.display_warn, this.display_primary, this.display_secondary);
      this.check_video_el();
   }

   reset() {
      this._video_el = null;
      this.container?.remove();
      this.check_video_el();
      this.subs.reset();
   }

   private check_video_el() {
      if (this.video_el) { return; };
      setTimeout(this.check_video_el, 1000);
   }

   get video_el() {
      if (!this._video_el) {
         if (!location.href.includes('https://www.netflix.com/watch/')) { return null; }
         this._video_el = document.querySelector<HTMLVideoElement>(this.video_el_selector);
         if (!this._video_el) { return null; }
         this._video_el.ontimeupdate = this.ontimeupdate.bind(this);
         this.warn_caption = this.create_caption_el('yellow');
         this.secondary_caption = this.create_caption_el('#eee');
         this.primary_caption = this.create_caption_el('#fff');
         this.container = this.create_container([this.warn_caption, this.primary_caption, this.secondary_caption]);
         document.body.appendChild(this.container);
         this.subs.init();
      }
      return this._video_el;
   }

   private display_warn = (txt: string) => {
      if (!this.warn_caption) { return; }
      this.warn_caption.innerHTML = txt;
   };
   private display_primary = (txt: string) => {
      if (!this.primary_caption) { return; }
      this.primary_caption.innerHTML = txt;
   };

   private display_secondary = (txt: string) => {
      if (!this.secondary_caption) { return; }
      this.secondary_caption.innerHTML = txt;
   };

   private create_container(childs: HTMLElement[]): HTMLDivElement {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.bottom = '15%';
      container.style.left = '25%';
      container.style.width = '50%';
      container.style.textAlign = 'center';
      container.style.zIndex = '999999';
      childs.forEach((c) => { container.appendChild(c); });
      return container;
   }

   private create_caption_el(color = '#fff'): HTMLParagraphElement {
      const el = document.createElement('p');
      el.setAttribute('style',
         `font-size:17px;
         color:${color};
         text-shadow:#000000 0px 0px 7px;
         font-family:Netflix Sans,Helvetica Nueue,Helvetica,Arial,sans-serif;
         font-weight:bolder`
      );
      return el;
   }

   state_change(state: Partial<IVisibleState>) {
      this.subs.display(state);
   }

   private ontimeupdate() {
      if (!this.video_el) { return; }
      this.subs.tick(this.video_el.currentTime);
      this.dispatch('timeupdate', { timestamp: this.video_el.currentTime });
   }
}

interface IEvent {
   timestamp: number;
}

type Action = 'timeupdate';