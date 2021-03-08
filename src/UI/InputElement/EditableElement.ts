import { convertToHTML, IWordData, replaceLastWord, trimEnd } from '~/std/string';
import BaseElement, { CURSOR_MARKER } from '~/UI/InputElement/Base';

export default class EditableElement extends BaseElement<HTMLDivElement> {

   static from(el: EventTarget | null) {
      if (!EditableElement.is(el)) { return null; };
      return new EditableElement(el as HTMLDivElement);
   }

   static is(el: EventTarget | null) {
      return (el as HTMLDivElement)?.isContentEditable;
   }

   async replace(data: IWordData) {
      const range = window.getSelection()?.getRangeAt(0);
      const html = await this.replaceNodeContent(data, range);
      if (html === '') {
         this.value = this.el.innerHTML;
         return;
      }
      this.el.innerHTML = typeof html === 'string' ? html : await this.replaceSelectedContent(data, range);
      this.setCaret();
      this.value = this.el.innerHTML;
   }

   private async replaceNodeContent(data: IWordData, range?: Range) {
      const node = range?.endContainer as HTMLElement | undefined;
      if (node === this.el) { return Promise.resolve(null); }
      const value = node?.innerHTML
         || node?.nodeValue
         || node?.previousElementSibling?.innerHTML
         || node?.previousSibling?.nodeValue;
      if (!value || !trimEnd(value)) { return Promise.resolve(''); }
      const replaced = await replaceLastWord(value, data);
      if (replaced === value) {
         this.setCursorMarket(node, range);
         return Promise.resolve(this.el.innerHTML);
      }
      const no_marker = !replaced.includes(CURSOR_MARKER);
      return this.el.innerHTML.replace(
         convertToHTML(value).trimEnd(),
         `${convertToHTML(replaced).trimEnd()}${no_marker ? CURSOR_MARKER : ''}`);
   }

   private async replaceSelectedContent(data: IWordData, range?: Range) {
      range && range.setStart(this.el, 0);
      const replaced = await replaceLastWord(this.getSelection(range).innerHTML, data);
      const no_marker = !replaced.includes(CURSOR_MARKER);
      range && range.deleteContents();
      return `${convertToHTML(replaced.trimEnd())}${no_marker ? CURSOR_MARKER : ''}${this.el.innerHTML}`;
   }

   private setCaret() {
      const cursorNode = findNodeIncludes(this.el, CURSOR_MARKER);
      const pos = cursorNode?.textContent?.indexOf(CURSOR_MARKER) || 0;
      if (!cursorNode) { return; }
      cursorNode.textContent = cursorNode.textContent?.replace(new RegExp(CURSOR_MARKER, 'gi'), '') || '';
      const range = document.createRange();
      range.setStart(cursorNode, pos);
      range.collapse(true);

      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
   }

   private setCursorMarket(node?: HTMLElement, range?: Range) {
      if (node?.innerText) {
         const endSelection = this.getSelection(range).innerText.length || this.getSelection(range).innerHTML.length;
         node.innerText = node.innerText.substring(0, endSelection + 1)
            + CURSOR_MARKER
            + node.innerText.substring(endSelection + 1);
         return;
      }
      if (node?.nodeValue) {
         const endSelection = range?.endOffset || this.getSelection(range).innerText.length;
         node.nodeValue = node.nodeValue?.substring(0, endSelection)
            + CURSOR_MARKER
            + node.nodeValue?.substring(endSelection);
      }
   }

   private getSelection(range?: Range) {
      range && range.setStart(this.el, 0);
      const clonedSelection = range && range.cloneContents();
      const div = document.createElement('div');
      clonedSelection && div.appendChild(clonedSelection);
      return div;
   }
}


/**
 * Looking for Node with substring recursively
 */
function findNodeIncludes(node: Node, s: string): Node | null {
   if (node.nodeValue?.includes(s)) { return node; }
   const children = Array.from(node.childNodes);
   if (children.length === 0) { return null; }
   for (const child of children) {
      const node = findNodeIncludes(child, s);
      if (node) { return node; }
   }
   return null;
}