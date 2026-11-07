export const sceneOrder = [
  'BOOT',
  'NORMAL',
  'DETECT',
  'INCIDENT',
  'COUNTER',
  'RECOVERY',
  'END',
] as const;
export type Scene = (typeof sceneOrder)[number];
export const scenes: Record<
  Scene,
  { name: string; alert: string; banner: string; tone: string }
> = {
  BOOT: { name: '起動準備', alert: '—', banner: '', tone: 'calm' },
  NORMAL: {
    name: '平常監視',
    alert: '5',
    banner: 'MONITORING / 全システム正常',
    tone: 'calm',
  },
  DETECT: {
    name: '異常検知',
    alert: '4',
    banner: 'WARNING: 異常検知',
    tone: 'warning',
  },
  INCIDENT: {
    name: '障害進行',
    alert: '2',
    banner: 'CRITICAL: 電子カルテ 応答なし',
    tone: 'critical',
  },
  COUNTER: {
    name: '対処実行',
    alert: '1',
    banner: 'AWAITING COMMAND / 対処コマンド入力待ち',
    tone: 'critical',
  },
  RECOVERY: {
    name: '復旧処理',
    alert: '1',
    banner: 'RECOVERING / システムを順次復旧中',
    tone: 'recovery',
  },
  END: {
    name: '復旧完了',
    alert: '5',
    banner: 'ALL SYSTEMS NOMINAL / 復旧完了',
    tone: 'calm',
  },
};

export const turnStages = [
  'ISOLATE SEGMENT',
  'FAILOVER TO DR SITE',
  'PURGE SESSIONS',
];
export const TURN_DURATION = 8000;
export const STAGE_START = 500;
export const STAGE_DURATION = 2200;
