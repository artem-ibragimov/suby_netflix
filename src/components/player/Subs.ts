import { ISubs } from '~/subs';
import { SubTrackComponent } from './sub/Track';

export class SubsComponent {
   private container: HTMLDivElement;
   private primary_track: SubTrackComponent = new SubTrackComponent();
   private secondary_track: SubTrackComponent = new SubTrackComponent();
   private primary_caption: HTMLParagraphElement;
   private secondary_caption: HTMLParagraphElement;
   private warn_caption: HTMLParagraphElement;
   private captions_disabled: boolean = true;

   constructor() {
      this.display = this.display.bind(this);
      // @ts-ignore
      chrome.runtime.onMessage.addListener(this.add_subs.bind(this));
      document.addEventListener('click', (e) => {
         if ((<HTMLElement> e.target).classList.contains('track')) {
            this.captions_disabled = (<HTMLElement> e.target).innerText === 'Off';
            if (this.captions_disabled && !this.primary_track.is_empty && !this.secondary_track.is_empty) {
               this.display_warn('');
            }
         }
      });
      this.warn_caption = this.create_caption_el('yellow');
      this.secondary_caption = this.create_caption_el('#eee');
      this.primary_caption = this.create_caption_el('#fff');
      this.container = this.create_container([this.warn_caption, this.primary_caption, this.secondary_caption]);
      document.body.appendChild(this.container);
   }

   display({ primary_sub, secondary_sub }: Partial<IVisibleState>) {
      this.primary_track.display(primary_sub?.is_visible);
      this.secondary_track.display(secondary_sub?.is_visible);
   }

   tick(timestamp: number) {
      this.primary_track.tick(timestamp);
      this.display_primary(this.primary_track.to_string());

      this.secondary_track.tick(timestamp);
      this.display_secondary(this.secondary_track.to_string());
   }

   private display_warn(txt: string) {
      this.warn_caption.innerHTML = txt;
   }

   private display_primary(txt: string) {
      this.primary_caption.innerHTML = txt;
   }

   private display_secondary(txt: string) {
      this.secondary_caption.innerHTML = txt;
   }

   private add_subs(subs: ISubs) {
      if (this.captions_disabled) {
         this.display_warn('Netflix SUBS: Choose primary captions or disable me');
         return;
      }
      if (!this.primary_track.is_empty && this.secondary_track.is_empty) {
         this.secondary_track = new SubTrackComponent(subs);
         this.display_warn('Netflix SUBS: Secondary captions were added. Now, turn off all captions!');
         return;
      }
      this.primary_track = new SubTrackComponent(subs);
      this.secondary_track = new SubTrackComponent();
      this.display_warn('Netflix SUBS: Primary captions were added. Choose secondary ones!');
   }

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
}

export interface IVisibleState {
   primary_sub: { is_visible: boolean; },
   secondary_sub: { is_visible: boolean; },
}