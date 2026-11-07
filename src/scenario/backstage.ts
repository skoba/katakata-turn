export const backstage = {
  title: 'BACKSTAGE / 見えない裏側',
  intro: 'その頃クラウド側では',
  description: '病院側の苦情対応と並行して、見えない復旧作業が続いています。',
  hospital: '病院側でやったこと',
  handled: (count: number) => `苦情対応 ×${count} 件`,
};

export const backstageTimeline = [
  ['09:41', 'AZ-1 ストレージ障害を検知'],
  ['09:43', '自動フェイルオーバー開始'],
  ['09:52', 'DB レプリカ昇格'],
  ['10:05', '整合性チェック'],
  ['10:20', 'DNS 切替（TTL 待ち）'],
  ['10:31', '復旧宣言'],
] as const;
