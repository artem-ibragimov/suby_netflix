import Hack from '~/Hack/Base';
import { IWordData } from '~/std/string';

export default abstract class CustomElement<T> {
   value: string = '';

   constructor(readonly el: T) { }

   abstract replace(data: IWordData): void;

   applyHacks(hacks: Hack[]) {
      hacks.forEach((hack) => { hack.apply(this.value); });
   }
}

export const CURSOR_MARKER = '{CURSOR}';
