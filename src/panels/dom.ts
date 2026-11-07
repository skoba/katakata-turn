export function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}

export function panel(title: string, subtitle?: string): { root: HTMLElement; body: HTMLDivElement } {
  const root = element('section', 'panel');
  const header = element('div', 'panel-heading');
  header.append(element('h2', '', title));
  if (subtitle) header.append(element('span', 'panel-subtitle', subtitle));
  const body = element('div', 'panel-body');
  root.append(header, body);
  return { root, body };
}
