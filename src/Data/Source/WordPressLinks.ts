import BaseSource, { IParams } from '~/Data/Source/Base';
import { DATA_SOURCE_TYPE } from '~/Data/Source/const';
import SearchPopup from '~/UI/Popup/SearchPopup';

type UpdateType = { title: string, url: string; }[];
type DataType = { [key: string]: UpdateType; };
type ReturnType = string;

export default class WordPressLinks extends BaseSource<DataType, ReturnType, UpdateType> {
   private settings: Record<string, IShortcutConfig>;

   constructor(configs: IShortcutConfig[], private request_interval: number) {
      super(Object.fromEntries(configs.map(({ shortcut }) => [shortcut, []])));
      this.settings = Object.fromEntries(configs.map((cfg) => [cfg.shortcut, cfg]));
   }

   get(shortcut: keyof DataType, { wrap_link }: IParams) {
      const update = (query: string) => this.update(shortcut, query).then(() => this.data[shortcut]);
      return new SearchPopup(update, this.request_interval, wrap_link).show('');
   }

   async update(shortcut: keyof DataType, query: string) {
      if (!query) { return Promise.resolve(); }
      return this.load(shortcut, {
         url: createURL(this.settings[shortcut], query),
      });
   }

   protected onload(shortcut: keyof DataType, data: UpdateType) {
      this.data[shortcut] = data.map(({ title, url }) => ({ title, url }));
   }

   static from(configs: IShortcutConfig[], request_interval: number): WordPressLinks | null {
      const wpSettings = configs.filter(({ sourceType }) => sourceType === DATA_SOURCE_TYPE.WordPress);
      if (wpSettings.length === 0) {
         return null;
      }
      return new WordPressLinks(wpSettings, request_interval);
   }
}

const WP_API = '/wp-json/wp/v2/search?';

function createURL({ url, per_page, pages }: IShortcutConfig, query: string) {
   return `${url}${WP_API}search=${query}&per_page=${per_page}&page=${pages}`;
}

export interface IShortcutConfig {
   sourceType: DATA_SOURCE_TYPE;
   shortcut: string;
   per_page: number;
   pages: number;
   url: string;
};

export const DEFAULT_SHORTCUT_CONFIG: IShortcutConfig = {
   sourceType: DATA_SOURCE_TYPE.WordPress,
   url: 'https://wordpress.org/support/',
   shortcut: 'wpsupport:',
   per_page: 5,
   pages: 1
};

export const EMPTY_SHORTCUT_CONFIG: IShortcutConfig = {
   sourceType: DATA_SOURCE_TYPE.WordPress,
   shortcut: '',
   per_page: 5,
   pages: 1,
   url: '',
};

