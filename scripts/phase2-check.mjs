// Targeted Phase 2 checks. All pages are file:// and offline; time is virtual.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
  ...(process.env.PLAYWRIGHT_NO_SANDBOX === '1'
    ? { args: ['--no-sandbox'] }
    : {}),
});
const failures = [];
const requests = [];
async function audioReady(page, predicate) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await page.evaluate(predicate)) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  assert.fail('Web Audio did not settle within two seconds');
}
const url = pathToFileURL(resolve('dist/index.html'));
url.search = 'seed=123&nobeforeunload';
try {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    offline: true,
  });
  context.on('request', (request) => {
    if (/^(https?|wss?):/i.test(request.url())) requests.push(request.url());
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(message.text());
  });
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    window.__audio = { created: 0, resumed: 0, voices: 0 };
    window.AudioContext = class extends Native {
      constructor(...args) {
        super(...args);
        window.__audio.created++;
        window.__context = this;
      }
      resume() {
        window.__audio.resumed++;
        return super.resume();
      }
      createOscillator() {
        window.__audio.voices++;
        return super.createOscillator();
      }
      createGain() {
        const gain = super.createGain();
        window.__master ??= gain;
        return gain;
      }
    };
  });
  await page.goto(url.href);
  assert.equal(
    await page.evaluate(() => window.__audio.created),
    0,
    'no audio context before input',
  );
  await page.keyboard.press('Space');
  await audioReady(
    page,
    () => window.__audio.resumed >= 1 && window.__context.state === 'running',
  );
  await page.keyboard.press('t');
  assert.ok(
    await page.evaluate(() => window.__audio.voices > 0),
    'assistant start emits a real Web Audio tone',
  );
  await page.keyboard.press('m');
  await audioReady(page, () => window.__master.gain.value === 0);
  assert.equal(
    await page.evaluate(() => window.__master.gain.value),
    0,
    'M immediately mutes the master gain',
  );
  const voices = await page.evaluate(() => window.__audio.voices);
  await page.keyboard.press('t');
  assert.equal(
    await page.evaluate(() => window.__audio.voices),
    voices,
    'muted speech creates no tones',
  );
  await page.keyboard.press('m');
  await audioReady(page, () => window.__master.gain.value > 0);
  await page.keyboard.press('m');

  await page.keyboard.press('2');
  await page.clock.runFor(100);
  assert.equal(await page.locator('.alert-number').textContent(), '4');
  await page.clock.runFor(3000);
  assert.equal(await page.locator('.alert-number').textContent(), '3');
  await page.keyboard.press('3');
  await page.clock.runFor(100);
  assert.equal(await page.locator('.alert-number').textContent(), '2');
  await page.clock.runFor(29_900);
  assert.match(await page.locator('.intel-reloads').textContent(), /×58$/);
  assert.equal(await page.locator('.alert-number').textContent(), '1');
  await page.keyboard.press('4');
  await page.keyboard.press('Enter');
  await page.clock.runFor(8100);
  assert.equal(
    await page.locator('.console').getAttribute('data-scene'),
    'RECOVERY',
  );
  assert.equal(await page.locator('.alert-number').textContent(), '1');
  await page.clock.runFor(8600);
  assert.equal(await page.locator('.alert-number').textContent(), '5');
  assert.equal(await page.locator('.complaint-total').textContent(), '0');
  await page.keyboard.press('6');
  await page.clock.runFor(2500);
  await page.keyboard.press('t');
  await page.clock.runFor(2500);
  await page.keyboard.press('b');
  await page.clock.runFor(4000);
  assert.match(await page.locator('.backstage-reloads').textContent(), /×58$/);
  assert.match(
    await page.locator('.backstage-handled').textContent(),
    /×29 件$/,
  );
  assert.equal(await page.locator('.backstage-timeline li').count(), 6);

  for (const width of [1920, 1280]) {
    await page.setViewportSize({ width, height: (width * 9) / 16 });
    await page.clock.runFor(100);
    const latestVisible = await page
      .locator('.assistant-log')
      .evaluate((log) => {
        const box = log.getBoundingClientRect();
        return [...log.querySelectorAll('.assistant-speech:not([hidden])')]
          .slice(-3)
          .every((row) => {
            const rect = row.getBoundingClientRect();
            return rect.top >= box.top - 1 && rect.bottom <= box.bottom + 1;
          });
      });
    assert.ok(
      latestVisible,
      `${width}: at least three complete speech bubbles visible`,
    );
    if (width === 1920) {
      const rowHeight = await page
        .locator('.system-row')
        .first()
        .evaluate((row) => row.getBoundingClientRect().height);
      assert.ok(rowHeight >= 25, '1080p status rows retain spacing');
    }
    await page.screenshot({
      path: resolve(`docs/screenshots/15-phase2-backstage-${width}.png`),
    });
  }
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1920, height: 1080 });
  // Seed repeatability is measured at the same virtual frame and input sequence.
  async function seededSnapshot(seed) {
    const probe = await context.newPage();
    probe.on('pageerror', (error) => failures.push(error.message));
    // Drive exactly the same frame deltas; browser time origins vary by page.
    await probe.addInitScript(() => {
      let now = 0;
      let next;
      Object.defineProperty(performance, 'now', { value: () => now });
      window.requestAnimationFrame = (callback) => {
        next = callback;
        return 1;
      };
      window.__frames = (count) => {
        for (let i = 0; i < count; i++) {
          now += 16;
          const callback = next;
          next = null;
          callback(now);
        }
      };
    });
    await probe.goto(`${url.href.replace('seed=123', `seed=${seed}`)}`);
    await probe.keyboard.press('Space');
    await probe.keyboard.press('m');
    await probe.keyboard.press('4');
    await probe.keyboard.type('katakatakatakatakatakatakatakatakatakata');
    await probe.evaluate(() => window.__frames(313));
    const result = await probe.evaluate(() => ({
      terminal: document.querySelector('.terminal-input').textContent,
      history: document.querySelector('.terminal-history').textContent,
      confidence: document.querySelector('.assistant-confidence').textContent,
      hex: document.querySelector('.hex-data').textContent,
      sparks: [...document.querySelectorAll('.system-spark')].map((canvas) =>
        canvas.toDataURL(),
      ),
      topology: document.querySelector('.topology-panel canvas').toDataURL(),
    }));
    await probe.close();
    return result;
  }
  const first = await seededSnapshot(123);
  const replay = await seededSnapshot(123);
  for (const key of Object.keys(first))
    assert.ok(
      JSON.stringify(first[key]) === JSON.stringify(replay[key]),
      `${key} replays with the same seed`,
    );
  const other = await seededSnapshot(456);
  for (const key of ['terminal', 'confidence', 'hex', 'sparks', 'topology'])
    assert.ok(
      JSON.stringify(other[key]) !== JSON.stringify(first[key]),
      `${key} respects a different seed`,
    );

  console.log(
    'Audio, alerts, shared metrics, layout and seeded displays passed.',
  );
  await page.keyboard.press('1');
  await page.keyboard.press('a');
  await page.clock.runFor(20_100);
  assert.equal(
    await page.locator('.console').getAttribute('data-scene'),
    'DETECT',
  );
  await page.clock.runFor(20_000);
  assert.equal(
    await page.locator('.console').getAttribute('data-scene'),
    'INCIDENT',
  );
  await page.clock.runFor(20_000);
  assert.equal(
    await page.locator('.console').getAttribute('data-scene'),
    'COUNTER',
  );
  await page.clock.runFor(10_000);
  assert.ok(
    (await page.locator('.terminal-history').textContent()).length > 0,
    'autoplay types commands',
  );
  await page.clock.runFor(10_000);
  assert.equal(
    await page.locator('.turn-overlay').isVisible(),
    true,
    'autoplay starts the real turn',
  );
  await page.clock.runFor(8100);
  assert.equal(
    await page.locator('.console').getAttribute('data-scene'),
    'RECOVERY',
  );
  await page.clock.runFor(20_000);
  assert.equal(
    await page.locator('.console').getAttribute('data-scene'),
    'END',
  );
  await page.clock.runFor(20_000);
  assert.equal(
    await page.locator('.console').getAttribute('data-scene'),
    'NORMAL',
  );
  console.log(
    'Audio gesture / mute, alerts, shared ×58 / ×29, 1080p / 720p, seed repeatability and a full automatic cycle passed.',
  );

  // Pump the existing rAF callback at fixed 16 ms steps for the retention audit.
  // Avoid timer-task overhead; the application still runs every render/update.
  await page.evaluate(() => {
    let next;
    let now;
    window.requestAnimationFrame = (callback) => {
      next = callback;
      return 1;
    };
    window.__advance = (duration) => {
      now ??= performance.now();
      for (let remaining = duration; remaining > 0; remaining -= 16) {
        now += Math.min(16, remaining);
        const callback = next;
        next = null;
        callback(now);
      }
    };
  });
  await page.clock.runFor(16);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  const measure = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    const { metrics } = await cdp.send('Performance.getMetrics');
    const heap = metrics.find(
      (metric) => metric.name === 'JSHeapUsedSize',
    ).value;
    const dom = await page.evaluate(() => ({
      nodes: document.querySelectorAll('*').length,
      logs: document.querySelector('.event-list').childElementCount,
      feeds: [...document.querySelectorAll('.intel-list')].map(
        (list) => list.childElementCount,
      ),
      attacks: Number(
        document.querySelector('.topology-panel').dataset.attacks,
      ),
      sparks: Number(document.querySelector('.topology-panel').dataset.sparks),
    }));
    assert.ok(dom.logs <= 200 && dom.feeds.every((count) => count <= 30));
    assert.ok(dom.attacks <= 80 && dom.sparks <= 96);
    assert.ok(dom.nodes < 2200);
    return { heap, ...dom };
  };
  const baseline = await measure();
  let ending;
  for (let minute = 1; minute <= 10; minute++) {
    await page.evaluate(() => window.__advance(60_000));
    ending = await measure();
    console.log(
      `Autoplay +${minute} min: heap ${(ending.heap / 1048576).toFixed(2)} MiB, DOM ${ending.nodes}, log ${ending.logs}, feeds ${ending.feeds.join('/')}.`,
    );
  }
  assert.ok(
    ending.heap < baseline.heap + 2_000_000,
    'bounded retained heap after ten simulated minutes',
  );
  if ((await page.locator('.console').getAttribute('data-scene')) === 'COUNTER')
    await page.evaluate(() => window.__advance(8100));
  await page.keyboard.press('a');
  const stoppedScene = await page
    .locator('.console')
    .getAttribute('data-scene');
  await page.evaluate(() => window.__advance(20_100));
  assert.equal(
    await page.locator('.console').getAttribute('data-scene'),
    stoppedScene,
    'A returns to manual mode',
  );
  await page.keyboard.press('r');
  await page.evaluate(() => window.__advance(100));
  assert.equal(
    await page.locator('.console').getAttribute('data-scene'),
    'BOOT',
  );
  assert.deepEqual(failures, [], 'browser errors');
  assert.deepEqual(requests, [], 'external requests');
  console.log(
    'Ten-minute virtual-time autoplay stayed bounded; zero browser errors and zero external requests.',
  );
  await context.close();
} finally {
  await browser.close();
}
