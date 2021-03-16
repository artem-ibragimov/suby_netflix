export function init(el: HTMLElement) {
   const guid = `tooltip_${Math.random().toPrecision(7).replace('.', '')}`;
   const span = document.createElement('span');
   span.setAttribute('hidden', 'true');
   span.classList.add('tooltiptext', guid);

   el.classList.add('tooltip', guid);
   document.body.appendChild(span);
}

export function show(el: HTMLElement, tooltip: string) {
   const span = findTooltip(el);
   if (!span) { return; }
   span.innerHTML = tooltip;
   span.removeAttribute('hidden');
   span.setAttribute('style',
      `top: ${el.offsetTop + el.clientHeight + 6}px;
      left: ${el.offsetLeft}px;
      width: ${el.offsetWidth}px;`);
}

export function hide(el: HTMLElement) {
   const span = findTooltip(el);
   if (!span) { return; }
   span.setAttribute('hidden', 'true');
}
export function remove(el: HTMLElement) {
   const span = findTooltip(el);
   if (!span) { return; }
   span.remove();
}
function findTooltip(el: HTMLElement) {
   const guid = Array.from(el.classList.values()).find((c) => c.includes('tooltip_'));
   if (!guid) { return; }
   return document.querySelector(`span.${guid}`);
}