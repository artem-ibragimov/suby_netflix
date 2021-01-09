export function start({ origins }: IApplicationConfig = DEFAULT_APP_CONFIG): boolean {
   return origins.length === 0 || origins.some((origin) => location.href.includes(origin));
}

export function isReplacable(el: HTMLElement): boolean {
   return el.getAttribute('datas-replace') !== 'disable';
}

export interface IApplicationConfig {
   /** Some shortcuts are available on specific sites */
   origins: string[];
   /** MS */
   request_interval: number;
}

export const DEFAULT_APP_CONFIG: IApplicationConfig = {
   origins: [],
   request_interval: 500
};