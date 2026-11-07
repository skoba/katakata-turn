import type { Scene } from '../scenario/scenes';

export type Action =
  | 'next'
  | 'previous'
  | 'enter'
  | 'type'
  | 'backstage'
  | 'help'
  | 'mute'
  | 'auto'
  | 'reset'
  | 'fullscreen'
  | 'close'
  | 'blocked'
  | `jump-${1 | 2 | 3 | 4 | 5 | 6}`;
export type KeyInput = {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  isComposing?: boolean;
};
export type Binding = { action: Action | null; prevent: boolean };

export function mapKey(input: KeyInput, scene: Scene): Binding {
  const key = input.key.toLowerCase();
  const ctrl = !!input.ctrlKey;
  const modified = ctrl || input.metaKey || input.altKey;
  const result = (action: Action): Binding => ({ action, prevent: true });
  if (key === 'f5') return result('blocked');
  if ((ctrl || input.metaKey) && key === 'r') {
    return result(
      scene === 'COUNTER' &&
        ctrl &&
        input.shiftKey &&
        !input.altKey &&
        !input.metaKey
        ? 'reset'
        : 'blocked',
    );
  }
  if (input.isComposing) return { action: null, prevent: false };
  if (!modified) {
    if (key === 'pagedown' || key === 'arrowright') return result('next');
    if (key === 'pageup' || key === 'arrowleft') return result('previous');
    if (key === 'enter') return result('enter');
    if (key === 'escape') return result('close');
  }
  const functional =
    scene === 'COUNTER' ? ctrl && !input.metaKey && !input.altKey : !modified;
  if (functional) {
    if (/^[1-6]$/.test(key))
      return result(`jump-${Number(key) as 1 | 2 | 3 | 4 | 5 | 6}`);
    const features: Record<string, Action> = {
      b: 'backstage',
      h: 'help',
      '?': 'help',
      m: 'mute',
      a: 'auto',
      r: 'reset',
      f: 'fullscreen',
    };
    if (key in features) {
      if (scene === 'COUNTER' && ['r', 'f'].includes(key) && !input.shiftKey)
        return { action: null, prevent: false };
      return result(features[key]);
    }
  }
  if (!modified && input.key.length === 1) return result('type');
  return { action: null, prevent: false };
}
