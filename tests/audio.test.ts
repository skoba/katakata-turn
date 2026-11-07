import { afterEach, describe, expect, it, vi } from 'vitest';
import { Sfx } from '../src/audio/sfx';
import { Assistant } from '../src/engine/assistant';
import { createRng } from '../src/engine/rng';

function audioContext() {
  const voices: {
    stop: ReturnType<typeof vi.fn>;
    onended: (() => void) | null;
  }[] = [];
  const gains: { setValueAtTime: ReturnType<typeof vi.fn> }[] = [];
  const parameter = () => ({
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  const context = {
    state: 'suspended',
    currentTime: 0,
    destination: {},
    resume: vi.fn(async () => {
      context.state = 'running';
    }),
    createGain: () => {
      const gain = parameter();
      gains.push(gain);
      return { gain, connect: vi.fn(), disconnect: vi.fn() };
    },
    createOscillator: vi.fn(() => {
      const voice = {
        frequency: parameter(),
        start: vi.fn(),
        stop: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        onended: null,
      };
      voices.push(voice);
      return voice;
    }),
  };
  const construct = vi.fn(function () {
    return context;
  });
  vi.stubGlobal('AudioContext', construct);
  return { context, construct, voices, gains };
}

afterEach(() => vi.unstubAllGlobals());

describe('gesture-gated synthesized audio', () => {
  it('creates and resumes only on unlock; mute gates scheduled and future sounds', async () => {
    const { context, construct, voices, gains } = audioContext();
    const sfx = new Sfx();
    sfx.play('warning');
    expect(construct).not.toHaveBeenCalled();
    await sfx.unlock();
    expect(context.resume).toHaveBeenCalledTimes(1);
    sfx.play('turn');
    expect(voices).toHaveLength(3);
    sfx.setMuted(true);
    expect(gains[0].setValueAtTime).toHaveBeenLastCalledWith(0, 0);
    sfx.play('beep');
    expect(voices).toHaveLength(3);
    sfx.setMuted(false);
    sfx.setPaused(true);
    sfx.play('chime');
    expect(voices).toHaveLength(3);
    sfx.setPaused(false);
    sfx.play('chime');
    expect(voices).toHaveLength(6);
    sfx.reset();
    expect(voices.every((voice) => voice.stop.mock.calls.length === 2)).toBe(
      true,
    );
  });

  it('bounds live voices during repeated speech and recovers after completion', async () => {
    const { voices, context } = audioContext();
    const sfx = new Sfx();
    await sfx.unlock();
    for (let i = 0; i < 1000; i++) sfx.play('beep');
    expect(voices).toHaveLength(24);
    voices.forEach((voice) => voice.onended?.());
    context.currentTime = 1;
    sfx.play('key');
    sfx.play('key');
    expect(voices).toHaveLength(25);
  });

  it('tolerates missing or rejected audio support and allows a later resume', async () => {
    vi.stubGlobal('AudioContext', undefined);
    const sfx = new Sfx();
    await expect(sfx.unlock()).resolves.toBeUndefined();
    const { context } = audioContext();
    context.resume.mockRejectedValueOnce(new Error('gesture required'));
    await expect(sfx.unlock()).resolves.toBeUndefined();
    sfx.play('beep');
    expect(context.createOscillator).not.toHaveBeenCalled();
    await sfx.unlock();
    sfx.play('beep');
    expect(context.createOscillator).toHaveBeenCalledTimes(1);
  });

  it('emits speech-start cues for automatic reports and turn narration, with silence while OFF', async () => {
    const { voices } = audioContext();
    const sfx = new Sfx();
    await sfx.unlock();
    const assistant = new Assistant(createRng());
    assistant.speech.started.subscribe(() => {
      if (assistant.autonomy) sfx.play('beep');
    });
    assistant.changeScene('COUNTER');
    assistant.tick(2200, 2700, 2700);
    expect(voices).toHaveLength(2);
    assistant.toggleAutonomy();
    assistant.report();
    assistant.tick(2200, 4900, 4900);
    expect(voices).toHaveLength(2);
  });
});
