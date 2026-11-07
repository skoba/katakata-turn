import type { Scene } from './scenes';

export const intelCopy = {
  title: 'THREAT INTEL',
  subtitle: '外部情報',
  disclaimer: '要約は架空 / FICTIONAL SUMMARY',
  advisory: 'ADVISORY',
  cloud: 'CLOUD STATUS',
  updated: '最終更新',
  reloads: (count: number) => `ステータスページをリロード ×${count}`,
};

// Real agency names are used only as source labels; all summaries are fictional.
export const advisories = [
  {
    source: 'JPCERT/CC',
    summary: '医療機関を標的とした不正アクセスの増加について',
  },
  { source: 'IPA', summary: '閉域網経由の侵入試行に関する注意喚起' },
  {
    source: '厚生労働省',
    summary: '医療情報システムの障害時連絡体制の確認について',
  },
  { source: 'NISC', summary: '接続境界の監視と復旧手順の再確認について' },
] as const;
export const advisoryByScene: Record<Scene, number> = {
  BOOT: 0,
  NORMAL: 2,
  DETECT: 0,
  INCIDENT: 1,
  COUNTER: 3,
  RECOVERY: 2,
  END: 3,
};
export const cloudRegions = [
  { provider: 'クラウド基盤 A', region: 'リージョン東', affected: true },
  { provider: 'クラウド基盤 B', region: 'リージョン西', affected: false },
];
export const cloudStates = {
  nominal: '正常',
  investigating: '調査中',
  recovering: '復旧作業中',
  restored: '復旧',
};
export const cloudIssue = 'ストレージ障害';
export function cloudStatus(scene: Scene, affected: boolean): string {
  if (!affected) return cloudStates.nominal;
  if (scene === 'DETECT' || scene === 'INCIDENT')
    return `${cloudIssue} ${cloudStates.investigating}`;
  if (scene === 'COUNTER') return `${cloudIssue} ${cloudStates.recovering}`;
  if (scene === 'RECOVERY' || scene === 'END') return cloudStates.restored;
  return cloudStates.nominal;
}
export const intelTime = (timestamp: number): string =>
  new Date(timestamp).toLocaleTimeString('ja-JP', { hour12: false });
