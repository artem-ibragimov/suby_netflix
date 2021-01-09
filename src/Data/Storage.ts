export default class DataStorage {
   private sources: IDataSource[];
   constructor(sources: (IDataSource | null)[]) {
      this.sources = sources.filter<IDataSource>((s): s is IDataSource => s !== null);
   }

   async get(key: string) {
      return this.sources.find((source) => source.has(key))?.get(key)
         || Promise.reject(new Error('key is not found'));
   }
}

interface IDataSource {
   has(key: string): boolean;
   get(key: string): Promise<string> | void;
}