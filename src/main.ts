import WordPressLinks from '~/Data/Source/WordPressLinks';
import DataStorage from '~/Data/Storage';
import HelpscoutHack from '~/Hack/HelpscoutHack';
import EditableElement from '~/UI/InputElement/EditableElement';
import InputableElement from '~/UI/InputElement/InputableElement';
import UserStorage from '~/page/options/UserStorage';
import { isReplacable as isReplaceable, start } from '~/App/start';

(async function () {
   const storage = new UserStorage();
   const settings = await storage.getSettings();

   if (!start(settings.application)) {
      return;
   }

   const data = new DataStorage([WordPressLinks.from(settings.shortcuts, settings.application.request_interval)]);
   document.addEventListener('keyup', onKeyUp);

   async function onKeyUp(e: KeyboardEvent) {
      if (e.code !== 'Space' && e.key !== 'Enter' || !isReplaceable(e.target as HTMLElement)) { return; };
      const element = EditableElement.from(e.target) || InputableElement.from(e.target);
      if (element === null) { return; }
      await element.replace(data);
      element.applyHacks([new HelpscoutHack(element.el)]);
   }
})();