import Hack from '~/Hack/Base';

/**
 * At {@link https://helpscout.net/} user edits {@link EditableElement},
 * but value stores at the textarea and updates on user keyboard events.
 * After replacement we have to add new value at textarea forcibly
 * @class
 * @extends Hack
 */
export default class HelpscoutHack extends Hack {
   el: HTMLTextAreaElement | null = null;

   constructor(redactor: HTMLElement) {
      super();
      if (redactor === document.querySelector('div.redactor_redactor.redactor_editor')) {
         this.el = document.querySelector('textarea.redactor');
      }
   }

   /**
    * @param value replaced text
    */
   apply(value: string) {
      if (this.el === null) { return; }
      this.el.value = value;
   }
}