import { PlayerComponent } from 'src/components/PlayerCmp';
import { UserActions } from 'src/components/UserActions';
import { PlayerController } from 'src/core/PlayerCtrl';

window.onload = () => {
   /** hide original captions */
   document.head.innerHTML += '<style>.player-timedtext { visibility: hidden; } </style>';
   const rewind = () => { document.querySelector<HTMLButtonElement>('.button-nfplayerBackTen')?.click(); };
   const player_ctrl = new PlayerController(rewind);
   const player_cmp = new PlayerComponent('div.VideoContainer video');
   player_cmp.on('timeupdate', player_ctrl.timeupdate);
   player_ctrl.on('state_change', player_cmp.state_change);

   const user_actions = new UserActions();
   user_actions.on('stepback', player_ctrl.stepback);
   history.pushState = function (...args) {
      debugger;
   };
   window.addEventListener('popstate', () => {
      player_cmp.reset();
      player_ctrl.reset();
   });
};
