import { EventBus } from 'src/core/EventBus';

const MS = 1000;
export class PlayerController extends EventBus<Action, Partial<IVisibilityState>> {
   /** Step size in seconds */
   private step_size: number = 10;
   /** Timestamp before rewind */
   private end_timestamp: number = 0;
   private start_timestamp: number = 0;
   private rewind_timeout?: NodeJS.Timeout;
   private state: IState = {
      video: { timestamp: 0 },
      primary_sub: { is_visible: false },
      secondary_sub: { is_visible: false },
   };

   constructor(
      /** Rewind original video */
      private rewind: () => void
   ) {
      super();
      this.stepback = this.stepback.bind(this);
      this.timeupdate = this.timeupdate.bind(this);
      this.stepback_second = this.stepback_second.bind(this);
   }

   reset() {
      this.end_timestamp = 0;
      this.start_timestamp = 0;
      this.rewind_timeout = void 0;
      this.state = {
         video: { timestamp: 0 },
         primary_sub: { is_visible: false },
         secondary_sub: { is_visible: false },
      };
   }

   stepback() {
      if (this.end_timestamp < this.state.video.timestamp) {
         this.stepback_first();
         return;
      }
      this.stepback_second();
   }

   private stepback_first() {
      this.end_timestamp = this.state.video.timestamp;
      this.start_timestamp = this.state.video.timestamp - this.step_size;
      this.rewind();
      this.set_state({
         video: { timestamp: this.start_timestamp },
         primary_sub: { is_visible: true },
         secondary_sub: { is_visible: false },
      });
   }

   private stepback_second() {
      this.start_timestamp = this.state.video.timestamp - this.step_size;
      this.rewind();
      this.set_state({
         video: { timestamp: this.start_timestamp },
         primary_sub: { is_visible: true },
         secondary_sub: { is_visible: true },
      });
   }

   timeupdate({ timestamp }: { timestamp: number; }) {
      this.state.video.timestamp = timestamp;
      if (this.start_timestamp <= timestamp && timestamp <= this.end_timestamp) { return; }
      this.hide_subs();
   }

   private hide_subs() {
      if (!this.state.primary_sub.is_visible && !this.state.secondary_sub.is_visible) { return; }
      this.set_state({
         primary_sub: { is_visible: false },
         secondary_sub: { is_visible: false }
      });
   }

   private set_state(state: Partial<IState>): void {
      this.state = { ...this.state, ...state };
      this.dispatch('state_change', state);
   }
}

type Action = 'state_change';

interface IState extends IVisibilityState {
   video: { timestamp: number; };
}

interface IVisibilityState {
   primary_sub: { is_visible: boolean; },
   secondary_sub: { is_visible: boolean; },
}
