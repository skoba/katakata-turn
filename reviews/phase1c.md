# Phase 1c レビュー（NETWORK TOPOLOGY 置換・THREAT INTEL 追加・地図削除）

対象: HEAD `1a163e3`（Codex 5 コミット、40 files / +1159 −483）。検証: `reviews/phase1c/{1080p,720p}-*.png`、typecheck ✅ / test 31 件 ✅ / build ✅ dist 47 KB（地図データ削除で 107 KB → 47 KB）/ コンソールエラー 0 / 外部リクエスト 0 / F5 抑止 ✅ / Enter → RECOVERY ✅。

## 判定

| # | 項目 | 判定 | 根拠 |
|---|---|---|---|
| 1 | §4.2-2 / §4.8 NETWORK TOPOLOGY | ✅ | クラウド 2・境界 3・院内 7 セグメント（SW / AP / 端末）を幾何学図形で描画。攻撃粒子は左端 `UNKNOWN` / `BOTNET-NODE-07` から `INTERNET EDGE` へ、2.7 s でシールド環と火花、4.9 s で `DR ROUTE ACTIVE`（DR→VPN GW の経路が緑太線）。リンク色は SYSTEM STATUS と連動（INCIDENT で外来・手術室・VPN が琥珀、クラウド接続が赤）。1080p / 720p ともラベル重なりなし |
| 2 | §4.8 地図関連の削除 | ✅ | scripts/gen-map.mjs, src/assets/world.ts, src/scenario/geography.ts, src/panels/threatMap.ts, d3-geo, gen:map, README 地図節を削除 |
| 3 | §4.7 THREAT INTEL | ✅ | ADVISORY（出典 JPCERT/CC / IPA / 厚生労働省 / NISC、本文は架空要約）と CLOUD STATUS（クラウド基盤 A/B、調査中→復旧作業中→復旧、最終更新）、`ステータスページをリロード ×N`、`要約は架空 / FICTIONAL SUMMARY` 常時表示。リロード件数は BACKSTAGE と共有 |
| 4 | §6 検査の許可リスト | ✅ | 公的機関名は `src/scenario/intel.ts` の `source` プロパティの文字列として単独で現れる場合のみ許可（TypeScript AST で検査）。要約に数字・URL・CVE/JVN が無いことも検査。ベンダー名・国名の禁止は維持 |
| 5 | §4.3 文言の地図依存除去 | ✅ | `map` / `attack` / `targets` / `sourceLabels` 等を messages.ts から削除。ハヤオの発話は元から地図非依存 |

## ❌（差し戻し）

1. **[§4.8 ノード状態] DR-SITE-WEST が電子カルテ（system 0）と状態を共有しているため、DETECT / INCIDENT / COUNTER で待機系まで琥珀→赤で描かれる。** 待機系は常に NOMINAL（緑）で、フェイルオーバー後は経路と同じ緑で点灯すべき。該当: src/scenario/topology.ts（`dr` ノードの `system`）, src/panels/topology.ts
2. **[§4.2-4 EVENT LOG] 行が増えた後、パネル最上段の行が上端で半分切れて見える**（全シーンのスクリーンショットで確認）。スクロール末尾表示のまま、上端の部分行を隠すか行高に合わせて切る。該当: src/panels/eventLog.ts, src/styles/panels.css

## 所見（基準外）

- リロードカウンタは INCIDENT 中 2 秒ごとに +1。LT では INCIDENT 滞在が 30 秒程度なので ×15 前後になる。BACKSTAGE の「×58 回」の演出を出したいなら Phase 2 で加速係数を文言側に持たせるとよい。
- トポロジ左端（x < 150）に余白がある。攻撃元ラベルをそこへ寄せるとクラウドノードとの間隔が広がる。

## 修正往復 1 回目の結果（HEAD `a28a1ae`）

- ❌1 → ✅ `dr` ノードの `system` を省略可能にし、未対応ノードは NOMINAL 固定。INCIDENT 中も DR-SITE-WEST は緑、フェイルオーバー後は経路と同色。
- ❌2 → ✅ スクロールが生じたときだけ `mask-image` で上端 3rem をフェード。末尾表示は維持。
- 再検証: typecheck / test 31 件 / build ✅、コンソールエラー 0、外部リクエスト 0、F5 抑止 ✅、Enter → RECOVERY ✅、1080p / 720p 画像更新済み。

## 判定

❌ 0 件（修正往復 1 回）。
