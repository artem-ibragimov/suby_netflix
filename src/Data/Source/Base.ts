const DEFAULT_REQUEST_OPTIONS: IRequestOptions = {
   url: '/',
};
export default abstract class DataSource<
   DataType extends Record<string, any> = Record<string, string>,
   ReturnType = string,
   UpdateType = Record<string, string>,
   > implements IDataSource<DataType, ReturnType>{
   protected data: DataType;


   constructor(protected readonly default_data: DataType) {
      this.onerror = this.onerror.bind(this);
      this.onload = this.onload.bind(this);
      this.data = default_data;
   }

   async load(shortcut: keyof DataType, request_options: IRequestOptions) {
      return DataSource.request<UpdateType>(request_options)
         .then((data) => this.onload(shortcut, data))
         .catch(this.onerror);
   }

   static request<T = void>(request_options: IRequestOptions): Promise<T> {
      return new Promise<T>((resolve) => {
         // @ts-ignore
         chrome.runtime.sendMessage({
            url: request_options.url,
            options: request_options
         }, resolve);
      }).then((res) => {
         if (Object.keys(res).length === 0) {
            throw new Error('Failed to load');
         }
         return res;
      });
   }

   has(shortcut: keyof DataType) {
      return shortcut in this.data;
   }

   abstract get(shortcut: keyof DataType, params?: IParams): Promise<ReturnType>;
   protected abstract onload(shortcut: keyof DataType, data: UpdateType): void;

   private onerror(e: Error) {
      this.data = this.default_data;
      console.error(e);
   }
}

export interface IDataSource<DataType, ReturnType> {
   load(key: keyof DataType, options: IRequestOptions): Promise<void>;
   has(key: keyof DataType): boolean;
   get(key: keyof DataType, params?: IParams): Promise<ReturnType>;
}
interface IRequestOptions extends RequestInit {
   url: string,
   method?: 'GET' | 'POST';
}

export interface IParams {
   /** Wrap url into HTMLAnchorElement */
   wrap_link: boolean;
}