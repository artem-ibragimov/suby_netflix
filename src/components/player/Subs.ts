import { ISubs } from '~/subs';
import { SubTrackComponent } from './sub/Track';

export class SubsComponent {
   private primary_track: SubTrackComponent = new SubTrackComponent();
   private secondary_track: SubTrackComponent = new SubTrackComponent();
   private captions_disabled: boolean = true;

   constructor(
      private display_warn: (txt: string) => void,
      private display_primary: (txt: string) => void,
      private display_secondary: (txt: string) => void,
   ) {
      this.display = this.display.bind(this);
      chrome.runtime.onMessage.addListener(this.add_subs.bind(this));
      document.addEventListener('click', (e) => {
         const li = (<HTMLElement> e.target).closest('li');
         if (!li) { return; }
         const type = li.getAttribute('data-uia');
         if (!type) { return; }
         if (type.includes("subtitle-item")) {
            this.captions_disabled = (type === "subtitle-item-selected-Off" || type === "subtitle-item-Off");
            if (this.captions_disabled && !this.primary_track.is_empty && !this.secondary_track.is_empty) {
               this.display_warn('');
            }
         }
      });
      this.init();
   }

   init() {
      this.display_warn('Netflix SUBS: Choose primary captions or disable me');
   }

   reset() {
      this.display_warn('');
      this.captions_disabled = true;
      this.primary_track = new SubTrackComponent();
      this.secondary_track = new SubTrackComponent();
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

   private add_subs(subs: ISubs) {
      if (this.captions_disabled && !this.primary_track.is_empty && !this.secondary_track.is_empty) {
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
}

export interface IVisibleState {
   primary_sub: { is_visible: boolean; },
   secondary_sub: { is_visible: boolean; },
}