import { IWordData, replaceLastWord } from '~/std/string';
import BaseElement, { CURSOR_MARKER } from '~/UI/InputElement/Base';

export default class InputableElement extends BaseElement<HTMLTextAreaElement> {
   static from(el: EventTarget | null) {
      if (!InputableElement.is(el as HTMLElement)) { return null; };
      return new InputableElement(el as HTMLTextAreaElement);
   }

   async replace(data: IWordData) {
      const selected = this.el.value.slice(0, this.el.selectionEnd || void 0);
      const replaced = await replaceLastWord(selected, data, { wrap_link: /textarea/i.test(this.el.nodeName) });
      const not_selected = this.el.value.slice(this.el.selectionEnd || void 0);
      const no_marker = !replaced.includes(CURSOR_MARKER);
      this.el.value = `${replaced}${no_marker ? CURSOR_MARKER : ''}${not_selected}`;
      this.setCaret();
      this.value = this.el.value;
   }

   private setCaret() {
      const index = this.el.value.indexOf(CURSOR_MARKER);
      this.el.value = this.el.value.replace(new RegExp(CURSOR_MARKER, 'g'), '');
      this.el.setSelectionRange(index, index);
   }

   static is(element: HTMLElement): boolean {
      if (element == null || element.nodeType !== 1) { return false; }
      return /textarea/i.test(element.nodeName) ||
         /input/i.test(element.nodeName) &&
         /^(?:text|email|number|search|tel|url|password)$/i.test((element as HTMLInputElement).type);
   }
}