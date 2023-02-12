import { PlayerComponent } from 'src/components/PlayerCmp';
import { UserActions } from 'src/components/UserActions';
import { PlayerController } from 'src/core/PlayerCtrl';

const VIDEO_CONTAINER_SELECTOR = 'body video'
const BACK_BUTTON_SELECTORS = ['[aria-label="Seek Back"]', '[data-uia="control-back10"]'];
const get_back_button = () => {
   for (const s of BACK_BUTTON_SELECTORS) {
      const b = document.querySelector<HTMLButtonElement>(s);
      if (!!b) { return b; }
   }
   return null;
};

function main() {
   const rewind = () => {
      const back_button = get_back_button();
      back_button && back_button.click();
   };
   const player_ctrl = new PlayerController(rewind);
   const player_cmp = new PlayerComponent(VIDEO_CONTAINER_SELECTOR);
   player_cmp.on('timeupdate', player_ctrl.timeupdate);
   player_ctrl.on('state_change', player_cmp.state_change);

   const user_actions = new UserActions();
   user_actions.on('stepback', player_ctrl.stepback);
   window.addEventListener('popstate', () => {
      player_cmp.reset();
      player_ctrl.reset();
   });

   /** hide original captions */
   document.head.innerHTML += '<style>.player-timedtext { visibility: hidden; } </style>';
};

window.addEventListener('load', () => { setTimeout(main); });