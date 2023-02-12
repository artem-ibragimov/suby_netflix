import { EventBus } from 'src/core/EventBus';

export class UserActions extends EventBus<Action> {

   constructor() {
      super();
      document.addEventListener('keydown', (e) => {
         if (e.ctrlKey || e.code === "MetaRight" || e.code === "MetaLeft") {
            e.preventDefault();
            e.stopImmediatePropagation();
            this.dispatch('stepback');
         }
      });
   }
}

type Action = 'stepback';
