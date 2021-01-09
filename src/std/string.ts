//#region consts
const SYM: Record<string, ISymSet> = {
   HTML: { NB_SPACE: '&nbsp;', NEW_LINE: '<br>' },
   TXT: { NB_SPACE: '\u00a0', NEW_LINE: '\n' }
};
const SPACES = [' ', SYM.HTML.NB_SPACE, SYM.TXT.NB_SPACE];
const SEPARATORS = [...SPACES, SYM.TXT.NEW_LINE, SYM.HTML.NEW_LINE, '('];
//#endregion
export function trimEnd(s: string): string {
   return SPACES
      .reduce((str, space) => str.replace(new RegExp(space, 'g'), ' '), s)
      .trimEnd();
}

export function convertToHTML(s: string): string {
   return convertStringFrom(SYM.TXT, SYM.HTML, s);
}

export function convertToTXT(s: string): string {
   return convertStringFrom(SYM.HTML, SYM.TXT, s)
      .replace(/\u200b/g, '')
      .replace(/<([a-z,\/]+)>/gi, '');
}

export function convertStringFrom(replaceble: ISymSet, replace: ISymSet, s: string): string {
   return Object
      .entries(replaceble)
      .reduce((s, [k, v]) => s.replace(new RegExp(v, 'g'), replace[k as keyof ISymSet]), s);
}

export function getLastWord(s: string): string {
   if (!s) { return ''; }
   /** Remove invisible symbols and tags */
   const txt = trimEnd(convertToTXT(s));
   const f = (s: string, sep: string): string => s?.split(sep).reverse().find((w) => w !== '') || '';
   return SEPARATORS.reduce(f, txt);
}

export function replaceLastWord(s: string, data: IWordData) {
   const key = getLastWord(s);
   return data.get(key).then((value) =>
      s.slice(0, s.lastIndexOf(key)) +
      value +
      s.slice(s.lastIndexOf(key) + key.length)
   ).catch(() => s);
}

export type IWordData = { get(k: string): Promise<string>; };
type ISymSet = { NB_SPACE: string, NEW_LINE: string; };
