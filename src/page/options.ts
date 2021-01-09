import { DnD } from '~/page/options/DnD.js';
import { saveToFile } from '~/page/options/file.js';
import { AppConfigEditor, LinksEditor } from '~/page/options/UI';
import UserStorage, { ISettings } from '~/page/options/UserStorage.js';

(async function () {
   const appContainerEl = document.querySelector('#applicationContainer') as HTMLDivElement;
   const appEditor = new AppConfigEditor(appContainerEl);
   const shortcutContainerEl = document.querySelector('#shortcutsContainer') as HTMLDivElement;
   const addBtn = document.querySelector('#addShortcut') as HTMLButtonElement;
   const linksEditor = new LinksEditor(shortcutContainerEl, addBtn);
   const onUpdate = (s: string) => {
      const { application, shortcuts }: ISettings = JSON.parse(s);
      appEditor.render(application);
      linksEditor.render(shortcuts);
   };
   const storage = new UserStorage({ onUpdate });

   window.onunload = () => {
      const settings: ISettings = {
         application: appEditor.getSettings(),
         shortcuts: linksEditor.getSettings()
      };
      storage.applySettings(JSON.stringify(settings));
   };

   const dnd = new DnD('#drop-area');
   dnd.onFileDropped(storage.applySettings);

   const downloadBtn = document.querySelector('#download') as HTMLButtonElement;
   downloadBtn.onclick = () => {
      const settings: ISettings = {
         application: appEditor.getSettings(),
         shortcuts: linksEditor.getSettings()
      };
      saveToFile(JSON.stringify(settings), 'QuickLinkSettings.json');
   };

   const settings = await storage.getSettings();
   appEditor.render(settings.application);
   linksEditor.render(settings.shortcuts);
})();
