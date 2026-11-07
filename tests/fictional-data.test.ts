import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import ts from 'typescript';
import { packetFragments } from '../src/scenario/packets';
import { advisories } from '../src/scenario/intel';

const root = fileURLToPath(new URL('../src/scenario/', import.meta.url));
const allowedPublicSources = ['JPCERT/CC', 'IPA', '厚生労働省', 'NISC'];
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
    for (const name of [
      'assistant.ts',
      'intel.ts',
      'topology.ts',
      'packets.ts',
      'backstage.ts',
    ])
      expect(sources).toContain(join(root, name));
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
  it('allows public agencies only as advisory source labels', () => {
    for (const file of files(root)) {
      const source = ts.createSourceFile(
        file,
        readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
      );
      function visit(node: ts.Node) {
        if (
          ts.isStringLiteral(node) ||
          ts.isNoSubstitutionTemplateLiteral(node)
        ) {
          for (const name of allowedPublicSources) {
            if (!node.text.includes(name)) continue;
            expect(file).toBe(join(root, 'intel.ts'));
            expect(node.text).toBe(name);
            expect(ts.isPropertyAssignment(node.parent)).toBe(true);
            if (ts.isPropertyAssignment(node.parent))
              expect(node.parent.name.getText(source)).toBe('source');
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
    for (const advisory of advisories) {
      expect(allowedPublicSources).toContain(advisory.source);
      // General summaries contain no dates, document numbers, URLs or vulnerability IDs.
      expect(advisory.summary).not.toMatch(/[0-9]|https?:|www\.|CVE|CWE|JVN/i);
    }
  });
  it('uses protocol structure without patient segments or identifying fields', () => {
    const payload = packetFragments.join(' ');
    expect(payload).toContain('MSH|^~\\&|');
    expect(payload).toContain('"resourceType":"Bundle"');
    expect(payload).toContain('(0008,0060)');
    expect(payload).not.toMatch(
      /PID[|:=-]|Patient|identifier|birth|name|\b\d{8}\b|\b\d{4}[-/]\d{2}[-/]\d{2}\b/i,
    );
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
