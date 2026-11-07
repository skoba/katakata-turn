import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../src/scenario/', import.meta.url));
const banned = [
  'AWS',
  'Amazon',
  'Azure',
  'Microsoft',
  'Google',
  'GCP',
  'Oracle',
  'Alibaba',
  'IBM',
  'Tencent',
  'Cloudflare',
  'Salesforce',
  '日本',
  '中国',
  '米国',
  'アメリカ',
  'ロシア',
  '北朝鮮',
  '韓国',
  '英国',
  'イギリス',
  'フランス',
  'ドイツ',
  'インド',
  '台湾',
  'Japan',
  'China',
  'Russia',
  'Korea',
  'USA',
  'United States',
  'United Kingdom',
  'France',
  'Germany',
  'India',
  'Canada',
  'Australia',
  'Brazil',
  'Italy',
  'Spain',
  'カナダ',
  'オーストラリア',
  'ブラジル',
  'イタリア',
  'スペイン',
  '富士通',
  '日立',
];

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(dir, entry.name))
      : [join(dir, entry.name)],
  );
}

export function isDocumentationIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  return (
    parts.length === 4 &&
    parts.every((p) => p >= 0 && p <= 255) &&
    ['192.0.2', '198.51.100', '203.0.113'].includes(parts.slice(0, 3).join('.'))
  );
}

describe('fictional scenario data', () => {
  it('scans every scenario source, including future nested files', () => {
    const sources = files(root);
    expect(sources.length).toBeGreaterThan(0);
    for (const file of sources) {
      const source = readFileSync(file, 'utf8');
      for (const ip of source.match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g) ?? []) {
        expect(isDocumentationIPv4(ip), `${file}: ${ip}`).toBe(true);
      }
      for (const word of banned) {
        expect(source.toLowerCase(), `${file}: ${word}`).not.toContain(
          word.toLowerCase(),
        );
      }
      for (const ipv6 of source.match(/\b(?:[0-9a-f]{1,4}:){2,}[0-9a-f:]*/gi) ??
        []) {
        expect(
          ipv6.toLowerCase().startsWith('2001:db8:'),
          `${file}: ${ipv6}`,
        ).toBe(true);
      }
    }
  });
  it('rejects live addresses and invalid octets', () => {
    for (const ip of ['8.8.8.8', '10.0.0.1', '203.0.113.256', '192.0.3.1']) {
      expect(isDocumentationIPv4(ip)).toBe(false);
    }
    for (const ip of ['192.0.2.0', '198.51.100.255', '203.0.113.9']) {
      expect(isDocumentationIPv4(ip)).toBe(true);
    }
  });
});
