import { DEFAULT_APP_CONFIG, IApplicationConfig } from '~/App/start';
import { DEFAULT_SHORTCUT_CONFIG, IShortcutConfig } from '~/Data/Source/WordPressLinks';

export default class UserStorage {
   private onUpdate: (s: string) => void;

   constructor(
      { onUpdate }: { onUpdate: (_: string) => void; } = { onUpdate: () => void 0 }
   ) {
      this.applySettings = this.applySettings.bind(this);
      this.onUpdate = onUpdate;
   }

   getSettings(): Promise<ISettings> {
      return new Promise<string>((res, _) => {
         // @ts-ignore
         chrome.storage.sync.get('settings', (data) => {
            res(data && data.settings);
         });
      }).then<ISettings>((settings) => settings ? JSON.parse(settings) : DEFAULT_SETTINGS);
   };

   async applySettings(settings: string) {
      if (!settings) {
         throw new Error('Settings formatted incorrectly');
      }
      await this.saveSettings(settings);
      this.onUpdate(settings);
   }

   private saveSettings(settings: string) {
      return new Promise((res, _) => {
         // @ts-ignore
         chrome.storage.sync.set({ settings }, res);
      });
   }
}

export interface ISettings {
   application: IApplicationConfig;
   shortcuts: IShortcutConfig[];
}

export const DEFAULT_SETTINGS: ISettings = {
   application: DEFAULT_APP_CONFIG,
   shortcuts: [DEFAULT_SHORTCUT_CONFIG]
};