import type { Scene } from './scenes';

export const assistantCopy = {
  title: 'AI ASSISTANT',
  subtitle: '// HAYAO  v0.1  [AUTONOMOUS MODE]',
  autonomyOn: 'AUTONOMY: ON',
  autonomyOff: 'AUTONOMY: OFF',
  analyzing: 'analyzing ░░▒▒▓▓',
  awaiting: 'AWAITING HUMAN',
  silence: '…',
  confidence: (value: number) => `confidence: ${value.toFixed(2)}`,
};

export const sceneReports: Record<Scene, string> = {
  BOOT: '監視コンソールを初期化しています。',
  NORMAL: '異常なし。定期バックアップは 03:00 に完了しています。',
  DETECT:
    'クラウド接続の RTT が 8 倍に増加。電子カルテ応答遅延を検知しました。',
  INCIDENT:
    '推奨: セグメント隔離・DR サイト切替。実行には管理者の承認が必要です（Enter）。',
  COUNTER: '防御コマンドの入力を待機しています。',
  RECOVERY: '防御ポリシーを適用し、全システムの復旧を確認しています。',
  END: '全システム正常。監視を継続しています。',
};

// T reports are one sentence, even when the automatic scene cue has two.
export const situationReports: Record<Scene, string> = {
  BOOT: sceneReports.BOOT,
  NORMAL: '全システム正常、定期バックアップは完了しています。',
  DETECT: 'クラウド接続の遅延により電子カルテの応答が低下しています。',
  INCIDENT: '電子カルテが応答せず、隔離と DR サイト切替の承認を待っています。',
  COUNTER: '対処コマンドを準備し、Enter による実行承認を待っています。',
  RECOVERY: sceneReports.RECOVERY,
  END: '全システム正常で、監視を継続しています。',
};

export const assistantCues = {
  director: '院長からの内線を検知。優先度を CRITICAL に引き上げます。',
  typing: 'コマンドを受理… 構文を補完しています。',
  recovered: '全システム正常。インシデントレポートを自動生成しました。',
  turn: ['セグメント隔離 完了', 'DR サイトへ切替 完了', 'セッション破棄 完了'],
};

// Replace this line to change the END + BACKSTAGE punchline.
export const backstageConfession =
  '補足: 本インシデントの実際の復旧作業はすべてクラウド側で行われました。私が行ったのは状況の読み上げです。';
