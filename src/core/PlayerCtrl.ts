import { EventBus } from 'src/core/EventBus';

const MS = 1000;
export class PlayerController extends EventBus<Action, Partial<IVisibilityState>> {
   /** Step size in seconds */
   private step_size: number = 10;
   /** Timestamp before rewind */
   private last_timestamp: number = 0;
   private begin_timestamp: number = 0;
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
      this.last_timestamp = 0;
      this.begin_timestamp = 0;
      this.state = {
         video: { timestamp: 0 },
         primary_sub: { is_visible: false },
         secondary_sub: { is_visible: false },
      };
   }

   stepback() {
      if (this.begin_timestamp > this.state.video.timestamp) { return; }
      if (this.last_timestamp < this.state.video.timestamp) {
         this.stepback_first();
         return;
      }
      if (this.state.primary_sub.is_visible) {
         this.stepback_second();
      }
   }

   private stepback_first() {
      this.update_timestamps();
      this.rewind();
      this.set_state({
         video: { timestamp: this.begin_timestamp },
         primary_sub: { is_visible: true },
         secondary_sub: { is_visible: false },
      });
   }

   private stepback_second() {
      this.update_timestamps();
      this.rewind();
      this.set_state({
         video: { timestamp: this.begin_timestamp },
         primary_sub: { is_visible: true },
         secondary_sub: { is_visible: true },
      });
   }

   private update_timestamps() {
      this.last_timestamp = Math.ceil(this.state.video.timestamp) + 1;
      this.begin_timestamp = Math.floor(this.state.video.timestamp - this.step_size) - 1;
   }

   timeupdate({ timestamp }: { timestamp: number; }) {
      this.state.video.timestamp = timestamp;
      if (this.begin_timestamp <= timestamp && timestamp <= this.last_timestamp) { return; }
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
