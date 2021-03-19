export enum COLOR {
   GREEN = '#f0fff0',
   RED = '#ffe7e7'
}

export function highlight(el: HTMLElement, color: string) {
   el.style.background = color;
}