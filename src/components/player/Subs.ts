import { ISubs } from '~/subs';
import { SubTrackComponent } from './sub/Track';

export class SubsComponent {
   private container!: HTMLDivElement;
   private primary_track: SubTrackComponent = new SubTrackComponent();
   private secondary_track: SubTrackComponent = new SubTrackComponent();
   private captions_disabled: boolean = true;

   constructor() {
      this.state_change = this.state_change.bind(this);
      // @ts-ignore
      chrome.runtime.onMessage.addListener(this.add_subs.bind(this));
      document.addEventListener('click', (e) => {
         if ((<HTMLElement> e.target).classList.contains('track')) {
            this.captions_disabled = (<HTMLElement> e.target).innerText === 'Off';
            if (this.captions_disabled && !this.primary_track.is_empty && !this.secondary_track.is_empty) {
               this.clear_display();
            }
         }
      });
      this.create_container();
   }

   state_change({ video, primary_sub, secondary_sub }: Partial<IStateChange>) {
      this.primary_track.state_change(video?.timestamp, primary_sub?.is_visible);
      this.secondary_track.state_change(video?.timestamp, secondary_sub?.is_visible);
      if (video) {
         const txt = [this.primary_track.to_string(video.timestamp), this.secondary_track.to_string(video.timestamp)];
         this.display_text(txt);
      }
   }

   seek(timestamp: number) {
      this.primary_track.seek(timestamp);
      this.secondary_track.seek(timestamp);
   }

   private display_warn(txt: string) {
      this.display_text([txt], 'yellow');
   }

   private clear_display() {
      this.container.innerHTML = '';
   }

   private display_text(txt: string[], color = '#ffffff'): void {
      if (txt.every((t) => t === '')) { return; }
      this.container.innerHTML = txt.map((t) =>
         `<span style="font-size:17px; line-height:normal; font-weight:normal; color:${color}; text-shadow:#000000 0px 0px 7px; font-family:Netflix Sans,Helvetica Nueue,Helvetica,Arial,sans-serif;font-weight:bolder">
               ${t}
            </span>`)
         .join('');
   }

   private add_subs(subs: ISubs) {
      if (this.captions_disabled) {
         this.display_warn('Choose primary captions!');
         return;
      }
      if (!this.primary_track.is_empty && this.secondary_track.is_empty) {
         this.secondary_track = new SubTrackComponent(subs);
         this.display_warn('Secondary captions were added.\nTurn off captions!');
         return;
      }
      this.primary_track = new SubTrackComponent(subs);
      this.secondary_track = new SubTrackComponent();
      this.display_warn('Primary captions were added.\nChoose secondary ones!');
   }

   private create_container() {
      this.container = document.createElement('div');
      this.container.style.position = 'fixed';
      this.container.style.bottom = '15%';
      this.container.style.left = '25%';
      this.container.style.width = '50%';
      this.container.style.textAlign = 'center';
      this.container.style.zIndex = '999999';
      document.body.appendChild(this.container);
   }
}

export interface IStateChange {
   video: { timestamp: number; };
   primary_sub: { is_visible: boolean; },
   secondary_sub: { is_visible: boolean; },
}