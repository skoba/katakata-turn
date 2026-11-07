# Phase 1 レビュー（Claude Code）

対象: HEAD `fb15342`（Codex 14 コミット）。検証環境: Node 22.23.4 / Playwright Chromium headless 143 / 1920×1080・1280×720。
スクリーンショット: `reviews/phase1/{1080p,720p}-*.png`（Playwright 撮影、`?seed=1&nobeforeunload`）。

## §7 受け入れ基準

| # | 基準 | 判定 | 根拠 |
|---|---|---|---|
| 1 | `npm ci && npm run build` 成功、`dist/index.html` 単一・2 MB 未満 | ✅ | npm ci 52 packages / dist 98.9 KB、`http(s)://` 参照 0 件 |
| 2 | file:// で開いて動作、コンソールエラー 0 | ✅ | headless Chromium（file://）で pageerror / console.error 0 件。Windows 実機 Chrome / Edge は未検証（Codex も同様） |
| 3 | 外部ネットワークリクエスト 0 件 | ✅ | 全リクエスト 1 件（index.html 自身のみ）。CSP `default-src 'none'; connect-src 'none'` も付与 |
| 4 | 1080p / 720p でレイアウト破綻なし | ✅ | 両解像度の全シーン画像を目視。720p でも文字欠け・はみ出しなし |
| 5 | キーボードのみで BOOT→END を 3 分以内 | ✅ | Space→PageDown×3→文字入力→Enter→（自動）→PageDown で約 35 秒 |
| 6 | COUNTER で Enter→演出→RECOVERY 自動遷移、演出中の連打で壊れない | ✅ | 演出中に Enter/文字を 40 回連打後も RECOVERY へ遷移、エラーなし。`Scenario.busy` で状態機械側もロック |
| 7 | F5 でリロードされない、PageUp/PageDown で進む | ✅ | F5 後に `window.__mark` 残存。PageUp で END→RECOVERY |
| 8 | フラッシュ・点滅 3 Hz 未満 | ✅ | CSS アニメーションは `turn-flash` / `turn-shake`（300 ms、1 回）のみ。点滅系 keyframes なし。火花は 550 ms クールダウン |
| 9 | `npm test` 緑 | ✅ | 4 ファイル 13 テスト（scenario / typing / keymap / fictional-data） |
| 10 | 10 分放置でメモリ増大なし（概算） | ✅ | INCIDENT 25 s→COUNTER ターン→RECOVERY を 4 周（160 s）: heap 1.4→1.9→1.8→1.5 MB、DOM 665→1125→1195→1195（ログ 200 行上限で頭打ち）。自動再生は Phase 2 のため手動周回で代替 |
| 11 | README に起動手順・キー一覧・LT 進行例・文言編集方法・トラブル対処 | ✅ | 5 節すべてあり |

## SPEC 適合の所見（基準外・申し送り）

- ALERT LEVEL が DETECT=4 固定、INCIDENT=1 固定（SPEC は 4→3、2→1 の推移）。RECOVERY は 2→5。演出として問題ないが Phase 2 で推移させてもよい。
- THREAT MAP は等距円筒を等倍スケールで中央配置するため、パネル幅の約半分しか地図が使われていない（左右に余白）。Phase 2 で描画範囲を南緯 60°〜北緯 85° に切り詰めるなどして拡大すると迫力が出る。
- Enter は COUNTER 以外でも現在行を即完成させる（SPEC は「小演出のみ」）。害はない。
- BOOT 中はモディファイアキー単独（Shift 等）でも NORMAL へ進む。「任意キー」の解釈として許容。
- Phase 2 対象として未実装（README・NOTES に明記）: 効果音 / 動的 HEX / スパークライン / BACKSTAGE タイムライン / 自動再生 / `?seed=`（`?seed=` は Phase 1 の URL でも無害に無視される）。
- Codex は `.git` がサンドボックスで書込不可だったため `/tmp` の影リポジトリへコミット。本リポジトリへは fast-forward で取り込み済み（内容同一を `git status` で確認）。

## 判定

❌ 0 件。差し戻しなし。Phase 1 完了。
