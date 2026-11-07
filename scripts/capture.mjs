// Optional Phase 1 capture/smoke tool; no web server or network is required.
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
  url.search = 'nobeforeunload';
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
  await waitScene('BOOT');
  await page.waitForTimeout(3800);
  await capture('01-boot');
  await page.keyboard.press('Space');
  await waitScene('NORMAL');
  await page.waitForTimeout(250);
  await capture('02-normal');
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
  await page.waitForTimeout(5600);
  await capture('04-incident');
  await page.keyboard.press('PageDown');
  await waitScene('COUNTER');
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
  await page.waitForTimeout(7300);
  await capture('05b-counter-deployed');
  await page.waitForFunction(
    () =>
      document.querySelector('.console')?.getAttribute('data-scene') ===
      'RECOVERY',
    null,
    { timeout: 3000 },
  );
  await page.waitForTimeout(1800);
  await capture('06-recovery');
  await page.waitForTimeout(7300);
  assert.equal(
    await page.locator('.system-row[data-status="nominal"]').count(),
    10,
  );
  assert.equal(await page.locator('.complaint-total').textContent(), '0');
  await page.keyboard.press('PageDown');
  await waitScene('END');
  await page.waitForTimeout(150);
  await capture('07-end');
  await page.keyboard.press('h');
  await capture('08-help');
  await page.keyboard.press('Escape');
  await page.keyboard.press('b');
  await capture('09-backstage-static');
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
          '.system-row, .hex-data, .packet-footer, .complaint-row:not([hidden]), .complaint-empty:not([hidden])',
        )
        .evaluateAll((nodes) =>
          nodes
            .filter((node) => {
              const bounds = node
                .closest('.panel-body')
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
    if (viewport.width === 1280) await capture('10-end-720p');
  }
  await page.keyboard.press('r');
  await waitScene('BOOT');
  assert.deepEqual(failures, [], 'browser errors');
  assert.deepEqual(requests, [], 'external network requests');
  console.log(
    'Captured BOOT–END at 1920×1080; checked 720p, clicker, F5, turn input lock, recovery, zero browser errors and zero external requests.',
  );
  await context.close();
} finally {
  await browser.close();
}
