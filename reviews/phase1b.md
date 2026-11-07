# Phase 1b レビュー（§4.6 AI ASSISTANT「ハヤオ」差分タスク）

対象: HEAD `419860b`（Codex 3 コミット、27 files / +829 −42）。検証: `reviews/phase1b/{1080p,720p}-a*.png`、`katakata-turn-work/review/assistant.mjs` による自動確認（`?seed=1`）。
typecheck ✅ / test 25 件 ✅（assistant.test.ts 11 件追加）/ build ✅ dist 107 KB / コンソールエラー 0 / 外部リクエスト 0。

## §4.6 受け入れ基準

| # | 基準 | 判定 | 根拠 |
|---|---|---|---|
| 1 | 各シーンで 1 発話以上が自動で出る。Enter 演出中の実況が進捗バーと同期 | ✅ | NORMAL / DETECT / INCIDENT（+2.5 s で院長内線）/ COUNTER（乱打で「コマンドを受理…」）/ RECOVERY（+8.5 s でレポート生成）/ END / END+BACKSTAGE で告白、をすべて確認。実況は `STAGE_START + n×STAGE_DURATION`（2.7 / 4.9 / 7.1 s）ちょうどに発火し、Enter+2.6 s では未発話、+4.9 s で「セグメント隔離 完了」完了・「DR サイトへ」タイプ中 |
| 2 | `T` で任意に発話。AUTONOMY OFF で沈黙 | ✅ | NORMAL で T → 1 文の状況報告。COUNTER で Ctrl+T → 同様。Ctrl+Shift+A → ログが「…」のみ、`AWAITING HUMAN`、T 無反応。再度 Ctrl+Shift+A → 復帰報告 |
| 3 | 発話文言が fictional-data 検査対象 | ✅ | 文言は `src/scenario/assistant.ts` のみ。検査は `src/scenario/**` を再帰走査 |

## 所見（基準外・申し送り）

- 右列を STATUS / ASSISTANT / COMPLAINTS に三分割した結果、1080p の SYSTEM STATUS 行間が 31 px → 21 px に詰まり、720p の発話ログは最新 4 件のうち約 2.5 件分しか見えない（スクロールで末尾表示）。HEX を左下の横長帯へ移した分の余白が大きいので、Phase 2 の HEX 動的化と合わせて右列の高さ配分を見直すとよい。
- 発話中の点滅はカーソル 1 Hz のみ。アイコンは連続回転で点滅なし。
- `?seed=` はアシスタントの confidence にのみ使われる（Phase 2 で全体に適用予定）。

## 判定

❌ 0 件。差し戻しなし。
