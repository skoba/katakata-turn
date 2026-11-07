// Optional capture/smoke tool; no web server or network is required.
import { chromium } from 'playwright';
import { mkdir, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const output = resolve('docs/screenshots');
await mkdir(output, { recursive: true });
const files = await readdir('dist');
assert.deepEqual(files, ['index.html'], 'build must contain one HTML file');
assert.ok(
  (await stat('dist/index.html')).size < 2_000_000,
  'build must be below 2 MB',
);
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
try {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    offline: true,
  });
  const page = await context.newPage();
  page.on('request', (request) => {
    if (/^(https?|wss?):/i.test(request.url())) requests.push(request.url());
  });
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(message.text());
  });
  page.on('dialog', (dialog) => dialog.dismiss());
  const url = pathToFileURL(resolve('dist/index.html'));
  url.search = 'nobeforeunload&seed=123';
  await page.goto(url.href);
  const waitScene = (scene) =>
    page.waitForFunction(
      (expected) =>
        document.querySelector('.console')?.getAttribute('data-scene') ===
        expected,
      scene,
    );
  const capture = (name) =>
    page.screenshot({ path: resolve(output, `${name}.png`) });
  const speech = page.locator('.assistant-log');
  const waitSpeech = (text) =>
    page.waitForFunction(
      (expected) =>
        [...document.querySelectorAll('.assistant-speech:not([hidden])')]
          .at(-1)
          ?.textContent.includes(expected),
      text,
    );
  const assistantOn = async (enabled) => {
    await page.waitForFunction(
      (expected) =>
        document.querySelector('.assistant-panel')?.dataset.autonomy ===
        String(expected),
      enabled,
    );
  };
  const checkTopology = async () => {
    const layout = await page.locator('.topology-panel').evaluate((panel) => ({
      labels: JSON.parse(panel.dataset.labels),
      fontSize: Number(panel.dataset.fontSize),
      canvas: {
        width: panel.querySelector('canvas').clientWidth,
        height: panel.querySelector('canvas').clientHeight,
      },
      caption: (() => {
        const canvas = panel.querySelector('canvas').getBoundingClientRect();
        const caption = panel
          .querySelector('.topology-caption')
          .getBoundingClientRect();
        return {
          x: caption.x - canvas.x,
          y: caption.y - canvas.y,
          width: caption.width,
          height: caption.height,
          text: 'legend',
        };
      })(),
      attacks: Number(panel.dataset.attacks),
      sparks: Number(panel.dataset.sparks),
    }));
    assert.ok(layout.fontSize >= 13, 'topology labels must be >=13px');
    assert.ok(layout.attacks <= 80 && layout.sparks <= 96, 'bounded particles');
    const labels = [...layout.labels, layout.caption];
    for (let i = 0; i < labels.length; i++) {
      const a = labels[i];
      assert.ok(
        a.x >= 0 &&
          a.y >= 0 &&
          a.x + a.width <= layout.canvas.width + 1 &&
          a.y + a.height <= layout.canvas.height + 1,
        `clipped topology label: ${a.text}`,
      );
      for (const b of labels.slice(i + 1)) {
        const overlap =
          a.x < b.x + b.width &&
          b.x < a.x + a.width &&
          a.y < b.y + b.height &&
          b.y < a.y + a.height;
        assert.equal(
          overlap,
          false,
          `overlapping topology labels: ${a.text} / ${b.text}`,
        );
      }
    }
    assert.equal(await page.locator('.intel-disclaimer').isVisible(), true);
    for (const selector of [
      '.advisory-list .intel-entry',
      '.cloud-list .intel-entry',
    ])
      assert.ok(
        (await page.locator(selector).count()) <= 30,
        'bounded intel feed',
      );
  };
  await waitScene('BOOT');
  await page.waitForTimeout(3800);
  await capture('01-boot');
  await page.keyboard.press('Space');
  await waitScene('NORMAL');
  await waitSpeech('異常なし。定期バックアップは 03:00 に完了しています。');
  await capture('02-normal');
  await page.keyboard.press('t');
  await waitSpeech('全システム正常、定期バックアップは完了しています。');
  await page.keyboard.press('Control+Shift+a');
  await assistantOn(false);
  await waitSpeech('…');
  assert.equal(
    await page.locator('.assistant-status').textContent(),
    'AWAITING HUMAN',
  );
  await capture('11-assistant-autonomy-off');
  await page.keyboard.press('t');
  await page.waitForTimeout(150);
  assert.equal(await speech.textContent(), '…', 'T must stay silent while OFF');
  await page.keyboard.press('Control+Shift+a');
  await assistantOn(true);
  await page.keyboard.press('F5');
  await waitScene('NORMAL');
  await page.keyboard.press('PageDown');
  await waitScene('DETECT');
  await page.waitForTimeout(3500);
  await capture('03-detect');
  await page.keyboard.press('PageUp');
  await waitScene('NORMAL');
  await page.keyboard.press('3');
  await waitScene('INCIDENT');
  await page.waitForFunction(() =>
    document
      .querySelector('.cloud-list .intel-entry')
      ?.textContent.includes('ストレージ障害 調査中'),
  );
  const initialUpdate = await page
    .locator('.cloud-list .intel-updated')
    .first()
    .textContent();
  await page.waitForTimeout(5600);
  const incidentReloads = await page.locator('.intel-reloads').textContent();
  assert.match(incidentReloads, /×[1-9][0-9]*$/);
  assert.notEqual(
    await page.locator('.cloud-list .intel-updated').first().textContent(),
    initialUpdate,
  );
  assert.match(
    await page.locator('.cloud-list .intel-entry').first().textContent(),
    /ストレージ障害 調査中/,
  );
  await page.keyboard.press('b');
  assert.equal(
    await page.evaluate(
      () =>
        document.querySelector('.backstage-reloads').textContent ===
        document.querySelector('.intel-reloads').textContent,
    ),
    true,
  );
  await page.keyboard.press('Escape');
  await checkTopology();
  await capture('04-incident');
  await page.keyboard.press('PageDown');
  await waitScene('COUNTER');
  await page.keyboard.press('Control+Shift+a');
  await assistantOn(false);
  await page.keyboard.press('Control+t');
  await page.waitForTimeout(150);
  assert.equal(await speech.textContent(), '…');
  await page.keyboard.press('Control+Shift+a');
  await assistantOn(true);
  await page.keyboard.press('Control+t');
  await waitSpeech(
    '対処コマンドを準備し、Enter による実行承認を待っています。',
  );
  const beforeTyping = await speech.textContent();
  await page.keyboard.press('t');
  await waitSpeech('コマンドを受理… 構文を補完しています。');
  assert.notEqual(
    await speech.textContent(),
    beforeTyping,
    'plain T must type and trigger the COUNTER input cue',
  );
  await page.keyboard.type('bmh1rf katakatakatakatakatakatakatakata');
  await page.waitForTimeout(300);
  await capture('05-counter');
  assert.equal(
    await page.locator('.help').isVisible(),
    false,
    'plain H must type in COUNTER',
  );
  assert.equal(
    await page.locator('.backstage').isVisible(),
    false,
    'plain B must type in COUNTER',
  );
  await page.keyboard.press('Control+h');
  assert.equal(await page.locator('.help').isVisible(), true);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Enter');
  for (const key of [
    'Enter',
    'Enter',
    'PageDown',
    'PageUp',
    'Control+Shift+r',
    'F5',
  ])
    await page.keyboard.press(key);
  await waitScene('COUNTER');
  await page.waitForFunction(
    () => document.querySelector('.topology-panel')?.dataset.shield === 'true',
  );
  assert.equal(
    await page.locator('.topology-panel').getAttribute('data-route'),
    'primary',
  );
  await page.waitForFunction(
    () => document.querySelector('.topology-panel')?.dataset.route === 'dr',
  );
  await page.waitForFunction(
    () => document.querySelectorAll('.turn-overlay progress')[2]?.value === 1,
  );
  await page.waitForTimeout(150);
  await checkTopology();
  await capture('05b-counter-deployed');
  await waitSpeech('セッション破棄 完了');
  assert.match(await speech.textContent(), /セグメント隔離 完了/);
  assert.match(await speech.textContent(), /DR サイトへ切替 完了/);
  assert.deepEqual(
    await page
      .locator('.turn-overlay progress')
      .evaluateAll((bars) => bars.map((bar) => bar.value)),
    [1, 1, 1],
  );
  assert.equal(
    await page.locator('.assistant-speech:not([hidden])').count(),
    4,
  );
  await page.waitForFunction(
    () =>
      document.querySelector('.console')?.getAttribute('data-scene') ===
      'RECOVERY',
    null,
    { timeout: 3000 },
  );
  await page.waitForTimeout(1800);
  assert.match(
    await page.locator('.cloud-list .intel-entry').first().textContent(),
    /リージョン東: 復旧/,
  );
  await capture('06-recovery');
  await page.waitForTimeout(7300);
  assert.equal(
    await page.locator('.system-row[data-status="nominal"]').count(),
    10,
  );
  assert.equal(await page.locator('.complaint-total').textContent(), '0');
  await page.keyboard.press('PageDown');
  await waitScene('END');
  await waitSpeech('全システム正常。監視を継続しています。');
  await capture('07-end');
  await page.keyboard.press('h');
  await capture('08-help');
  await page.keyboard.press('Escape');
  await page.keyboard.press('b');
  await waitSpeech('私が行ったのは状況の読み上げです。');
  assert.equal(
    await page.evaluate(
      () =>
        document.querySelector('.backstage-reloads').textContent ===
        document.querySelector('.intel-reloads').textContent,
    ),
    true,
  );
  const assistantBounds = await page.locator('.assistant-panel').boundingBox();
  const backstageBounds = await page.locator('.backstage').boundingBox();
  assert.ok(
    backstageBounds.x + backstageBounds.width <= assistantBounds.x,
    'BACKSTAGE must leave the confession visible',
  );
  await capture('09-backstage');
  await page.keyboard.press('Escape');
  // Check bounded visible panels at the two presentation resolutions.
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    for (const key of ['1', '2', '3', '4', '5', '6']) {
      const counter =
        (await page.locator('.console').getAttribute('data-scene')) ===
        'COUNTER';
      await page.keyboard.press(counter ? `Control+${key}` : key);
      await waitScene(
        ['NORMAL', 'DETECT', 'INCIDENT', 'COUNTER', 'RECOVERY', 'END'][
          Number(key) - 1
        ],
      );
      await page.waitForTimeout(120);
      await checkTopology();
      if (viewport.width === 1280 && key === '3')
        await capture('13-incident-720p');
      if (viewport.width === 1280 && key === '4') {
        await page.keyboard.press('Enter');
        await page.waitForFunction(
          () =>
            document.querySelector('.topology-panel')?.dataset.route === 'dr',
        );
        await checkTopology();
        await capture('14-counter-deployed-720p');
        await waitScene('RECOVERY');
      }
      const rightColumn = await page
        .locator('.right-column > .panel')
        .evaluateAll((panels) =>
          panels.map((panel) => ({
            title: panel.querySelector('h2').textContent,
            top: panel.getBoundingClientRect().top,
            bottom: panel.getBoundingClientRect().bottom,
          })),
        );
      assert.deepEqual(
        rightColumn.map((panel) => panel.title),
        ['SYSTEM STATUS', 'AI ASSISTANT', 'COMPLAINT QUEUE'],
      );
      assert.ok(
        rightColumn[0].bottom <= rightColumn[1].top &&
          rightColumn[1].bottom <= rightColumn[2].top,
      );
      const overflow = await page.locator('.panel').evaluateAll(
        (panels) =>
          panels.filter((panel) => {
            const r = panel.getBoundingClientRect();
            return (
              r.x < 0 ||
              r.y < 0 ||
              r.right > innerWidth + 1 ||
              r.bottom > innerHeight + 1
            );
          }).length,
      );
      assert.equal(overflow, 0, `${viewport.width}: panel overflow`);
      const clipped = await page
        .locator(
          '.system-row, .hex-data, .packet-footer, .intel-disclaimer, .intel-reloads, .complaint-row:not([hidden]), .complaint-empty:not([hidden]), .assistant-indicator',
        )
        .evaluateAll((nodes) =>
          nodes
            .filter((node) => {
              const bounds = node
                .closest('.panel-body, .panel-heading')
                .getBoundingClientRect();
              const rect = node.getBoundingClientRect();
              return (
                rect.bottom > bounds.bottom + 1 || rect.right > bounds.right + 1
              );
            })
            .map((node) => node.textContent),
        );
      assert.deepEqual(clipped, [], `${viewport.width}: clipped panel content`);
    }
    if (viewport.width === 1280) {
      await waitSpeech('全システム正常。監視を継続しています。');
      await capture('10-end-720p');
      await page.keyboard.press('b');
      await waitSpeech('私が行ったのは状況の読み上げです。');
      await capture('12-assistant-backstage-720p');
      await page.keyboard.press('Escape');
    }
  }
  await page.keyboard.press('r');
  await waitScene('BOOT');
  assert.deepEqual(failures, [], 'browser errors');
  assert.deepEqual(requests, [], 'external network requests');
  console.log(
    'Captured BOOT–END and assistant at 1080p / 720p; checked T / Ctrl+T, AUTONOMY, turn narration, BACKSTAGE confession, clicker, F5, input lock, recovery, topology label collisions / stage synchronization, intel refresh / shared reload count, zero browser errors and zero external requests.',
  );
  await context.close();
} finally {
  await browser.close();
}
