import { describe, expect, it } from 'vitest';
import { mapKey } from '../src/input/keymap';
import { sceneOrder } from '../src/scenario/scenes';

describe('clicker and keyboard mapping', () => {
  it('maps assistant shortcuts without stealing COUNTER typing or automatic-play keys', () => {
    for (const scene of sceneOrder) {
      expect(mapKey({ key: 't' }, scene).action).toBe(
        scene === 'COUNTER' ? 'type' : 'report',
      );
      expect(mapKey({ key: 'T', ctrlKey: true }, scene)).toEqual(
        scene === 'COUNTER'
          ? { action: 'report', prevent: true }
          : { action: null, prevent: false },
      );
      expect(
        mapKey({ key: 'A', ctrlKey: true, shiftKey: true }, scene),
      ).toEqual({ action: 'autonomy', prevent: true });
      expect(mapKey({ key: 'a' }, scene).action).toBe(
        scene === 'COUNTER' ? 'type' : 'auto',
      );
      expect(mapKey({ key: 'a', ctrlKey: true }, 'COUNTER').action).toBe(
        'auto',
      );
    }
    expect(
      mapKey(
        { key: 'A', ctrlKey: true, shiftKey: true, isComposing: true },
        'COUNTER',
      ).action,
    ).toBeNull();
    expect(
      mapKey(
        { key: 'A', ctrlKey: true, shiftKey: true, altKey: true },
        'NORMAL',
      ).action,
    ).toBeNull();
  });
  it('maps clicker arrows and inhibits every F5 / reload variant', () => {
    for (const scene of sceneOrder) {
      expect(mapKey({ key: 'PageDown' }, scene).action).toBe('next');
      expect(mapKey({ key: 'PageUp' }, scene).action).toBe('previous');
      expect(mapKey({ key: 'ArrowRight' }, scene).action).toBe('next');
      expect(mapKey({ key: 'ArrowLeft' }, scene).action).toBe('previous');
      expect(mapKey({ key: 'F5', ctrlKey: true }, scene)).toEqual({
        action: 'blocked',
        prevent: true,
      });
      expect(mapKey({ key: 'r', ctrlKey: true }, scene)).toEqual({
        action: 'blocked',
        prevent: true,
      });
      expect(mapKey({ key: 'R', metaKey: true }, scene).prevent).toBe(true);
    }
  });
  it('treats all printable keys as terminal input in COUNTER', () => {
    for (const key of [
      'b',
      'B',
      'h',
      '?',
      'm',
      'a',
      'r',
      'f',
      '1',
      '6',
      ' ',
      '.',
      'z',
    ]) {
      expect(mapKey({ key }, 'COUNTER').action, key).toBe('type');
    }
    expect(mapKey({ key: 'b' }, 'NORMAL').action).toBe('backstage');
    expect(mapKey({ key: '1' }, 'NORMAL').action).toBe('jump-1');
  });
  it('requires Ctrl for counter features and Ctrl+Shift for reset/fullscreen', () => {
    for (const [key, action] of [
      ['b', 'backstage'],
      ['h', 'help'],
      ['m', 'mute'],
      ['a', 'auto'],
      ['4', 'jump-4'],
    ]) {
      expect(mapKey({ key, ctrlKey: true }, 'COUNTER').action).toBe(action);
    }
    expect(mapKey({ key: 'f', ctrlKey: true }, 'COUNTER').action).toBeNull();
    expect(
      mapKey({ key: 'F', ctrlKey: true, shiftKey: true }, 'COUNTER').action,
    ).toBe('fullscreen');
    expect(
      mapKey({ key: 'R', ctrlKey: true, shiftKey: true }, 'COUNTER').action,
    ).toBe('reset');
    expect(mapKey({ key: 'Enter' }, 'COUNTER').action).toBe('enter');
  });
  it('does not hijack composition or unrelated browser shortcuts', () => {
    expect(
      mapKey({ key: 'a', isComposing: true }, 'COUNTER').action,
    ).toBeNull();
    expect(mapKey({ key: 'c', ctrlKey: true }, 'NORMAL').prevent).toBe(false);
    expect(mapKey({ key: 'Tab' }, 'NORMAL').action).toBeNull();
  });
});
