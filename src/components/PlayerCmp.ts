import { EventBus } from 'src/core/EventBus';
import { SubsComponent, IStateChange } from 'src/components/player/Subs';

export class PlayerComponent extends EventBus<Action, IEvent>{
   private _video_el!: HTMLVideoElement | null;
   private subs: SubsComponent = new SubsComponent();;
   constructor(
      private video_el_selector: string,
   ) {
      super();
      this.state_change = this.state_change.bind(this);
      this.check_video_el = this.check_video_el.bind(this);
      this.check_video_el();
   }

   private check_video_el() {
      if (this.video_el) { return; };
      setTimeout(this.check_video_el, 1000);
   }

   get video_el() {
      if (!this._video_el) {
         this._video_el = document.querySelector<HTMLVideoElement>(this.video_el_selector);
         if (!this._video_el) { return null; }
         this._video_el.onseeked = this.onseeked.bind(this);
         this._video_el.ontimeupdate = this.ontimeupdate.bind(this);
      }
      return this._video_el;
   }

   state_change(state: Partial<IStateChange>) {
      this.subs.state_change(state);
   }

   private ontimeupdate() {
      if (!this.video_el) { return; }
      const state = { timestamp: this.video_el.currentTime };
      this.dispatch('timeupdate', state);
      this.subs.state_change({ video: state });
   }

   private onseeked() {
      if (!this.video_el) { return; }
      this.dispatch('onseeked', { timestamp: this.video_el.currentTime });
      this.subs.seek(this.video_el.currentTime);
   }
}

interface IEvent {
   timestamp: number;
}

type Action = 'timeupdate' | 'onseeked';