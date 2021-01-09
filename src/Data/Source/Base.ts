const DEFAULT_REQUEST_OPTIONS: IRequestOptions = {
   url: '/',
};
export default abstract class DataSource<
   DataType extends Record<string, any> = Record<string, string>,
   ReturnType = string,
   UpdateType = Record<string, string>,
   > implements IDataSource<DataType, ReturnType>{
   protected data: DataType;
   private request_options!: IRequestOptions;

   constructor(protected readonly default_data: DataType) {
      this.onerror = this.onerror.bind(this);
      this.onload = this.onload.bind(this);
      this.data = default_data;
   }

   async load(shortcut: keyof DataType, request_options: IRequestOptions) {
      this.request_options = {
         ...DEFAULT_REQUEST_OPTIONS,
         ...request_options
      };

      return new Promise<UpdateType>((resolve) => {
         // @ts-ignore
         chrome.runtime.sendMessage({
            url: this.request_options.url,
            options: this.request_options
         }, resolve);
      })
         .then((data) => this.onload(shortcut, data))
         .catch(this.onerror);
   }

   has(shortcut: keyof DataType) {
      return shortcut in this.data;
   }

   abstract get(shortcut: keyof DataType): Promise<ReturnType>;

   protected abstract onload(shortcut: keyof DataType, data: UpdateType): void;

   private onerror(e: Error) {
      this.data = this.default_data;
      console.error(e);
   }
}

export interface IDataSource<DataType, ReturnType> {
   load(key: keyof DataType, options: IRequestOptions): Promise<void>;
   has(key: keyof DataType): boolean;
   get(key: keyof DataType): Promise<ReturnType>;
}
interface IRequestOptions extends RequestInit {
   url: string,
   method?: 'GET' | 'POST';
}