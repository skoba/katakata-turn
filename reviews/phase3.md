# Phase 3 レビュー（仕上げ）

対象: HEAD `cabc968`（Codex 4 コミット、24 files / +253 −131）。検証: `reviews/phase3/*.png`、`npm run e2e`（同梱 Chromium 1200 を `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` で指定）、typecheck ✅ / test 44 件 ✅ / build ✅ dist 55 KB。

## §8 Phase 3 項目

| # | 項目 | 判定 | 根拠 |
|---|---|---|---|
| 1 | Playwright E2E（各シーン撮影、外部通信 0 件検証） | ✅ | `npm run e2e` = capture.mjs + phase2-check.mjs。1080p 11 枚 + 720p 6 枚を docs/screenshots/ に保存。外部通信 0・コンソールエラー 0・F5・連打ロック・自動再生 1 周・仮想 10 分の保持上限（heap 2.6 MiB 横ばい、DOM ≤ 1,366、log 200）を検証。この環境でも通過 |
| 2 | README 完成 | ✅ | 起動方法 / キー操作 / 5 分 LT 進行例（§1 の 4 段に対応、ハヤオ・THREAT INTEL・BACKSTAGE の使いどころ）/ 文言編集ガイド（§6 と公的機関名の扱い）/ トラブル対処（音・全画面・フォント・Playwright の Ubuntu 26.04 回避）/ 既知の問題 |
| 3 | GitHub Actions | ✅ | `.github/workflows/ci.yml`: push / PR で Node 22 の `npm ci && typecheck && test && build`。Pages 公開なし |
| 4 | NOTES.md 整理・既知の問題 | ✅ | 廃止済み判断（地図・Phase 1 保留）を削除し現行 27 項目に整理。既知の問題は README 末尾 |
| 追加 | HEX 文字サイズ / EVENT LOG 行数 | ✅ | 1080p で HEX 16.2 px、EVENT LOG に完全な 3 行（720p でも 3 行） |

## SPEC §7 最終チェック（Claude Code 判定）

| # | 基準 | 判定 | 備考 |
|---|---|---|---|
| 1 | `npm ci && npm run build`、単一 HTML・2 MB 未満 | ✅ | 55 KB |
| 2 | Chrome / Edge で file:// 動作、コンソールエラー 0 | ✅ | 同梱 Chromium（file://）で確認。Windows 実機 Chrome / Edge はユーザーが http://127.0.0.1:4173/ で目視済み。file:// ダブルクリックの実機確認は本番前リハーサルで |
| 3 | 外部ネットワークリクエスト 0 件 | ✅ | 全フェーズで確認、CSP も付与 |
| 4 | 1080p / 720p でレイアウト破綻なし | ✅ | reviews/phase3/ |
| 5 | キーボードだけで BOOT→END を 3 分以内 | ✅ | 約 35 秒 |
| 6 | Enter → 演出 → RECOVERY 自動遷移、連打耐性 | ✅ | |
| 7 | F5 抑止、PageUp / PageDown | ✅ | |
| 8 | 点滅 3 Hz 未満 | ✅ | アニメーションは turn-flash / turn-shake（1 回）とカーソル 1 Hz のみ |
| 9 | `npm test` 緑 | ✅ | 44 件 |
| 10 | 自動再生 10 分でメモリ増大なし | ✅ | 実時間 10 分（Claude 側ソーク: heap 1.3〜2.0 MB）＋ 仮想 10 分（E2E） |
| 11 | README の 5 項目 | ✅ | |

## 判定

❌ 0 件。Phase 3 完了。
