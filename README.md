# カタカタカタカタターン

架空記念病院の「対処している感」を出す、LT 用サイバー防衛コンソール。実際の監視・攻撃・患者情報の処理は行いません。実行時は外部通信ゼロ、すべて架空データです。

Phase 1 の MVP に §4.6 の AI アシスタント「ハヤオ」を追加しています。仕様の正本は [SPEC.md](SPEC.md)、実装上の判断は [NOTES.md](NOTES.md) を参照してください。MIT ライセンス。

## 起動

Node.js 20.19 以上の 20 系、または 22.12 以上（この環境では 22.23）と npm を使用します。

```sh
npm ci
npm run dev
```

表示されたローカル URL を Chrome / Edge で開きます。開発サーバーはローカル環境だけで使用します。

本番は次のビルド後、**`dist/index.html` をダブルクリック**してください。ファイルは約 100 KB、単一 HTML で、ネット接続・サーバー・追加アセットは不要です。配布時もこの 1 ファイルだけをコピーします。

```sh
npm run typecheck && npm test && npm run build
```

1920×1080 / 1280×720 向けの 16:9 画面です。4:3 では上下に余白が入ります。ブラウザのズームは 100% 推奨です。システムに日本語フォントを用意してください。

## キー操作

| キー                 | 操作                                                   |
| -------------------- | ------------------------------------------------------ |
| 任意キー（BOOT）     | 起動ログをスキップして NORMAL へ                       |
| PageDown / →         | 次のシーン                                             |
| PageUp / ←           | 前のシーン                                             |
| 1〜6                 | NORMAL / DETECT / INCIDENT / COUNTER / RECOVERY / END  |
| 印字キー・Space      | 防御側の架空コマンドを 3〜6 文字ずつ入力               |
| Enter                | COUNTER では 8 秒間のターン演出、他は COMMAND ACCEPTED |
| B                    | 静的 BACKSTAGE パネル                                  |
| H / ?                | ヘルプ                                                 |
| M                    | ミュート状態の表示切替（Phase 1 は音声なし）           |
| A                    | 自動再生が Phase 2 対応予定である旨を表示              |
| T                    | ハヤオが現在シーンの状況を 1 文で報告                  |
| Ctrl+Shift+A         | ハヤオの AUTONOMY を ON / OFF                          |
| R                    | BOOT へリセット                                        |
| F                    | 全画面の開始・終了                                     |
| Esc                  | ヘルプ / BACKSTAGE を閉じる                            |
| F5 / Ctrl+R / Meta+R | リロードを抑止                                         |

**COUNTER 中は印字キーがすべて TERMINAL 入力になります。** 機能操作は Ctrl+B / Ctrl+H / Ctrl+M / Ctrl+A / Ctrl+T / Ctrl+1〜6 等を使います。リセットは **Ctrl+Shift+R**、全画面は **Ctrl+Shift+F** です。AUTONOMY は全シーンで **Ctrl+Shift+A** です。矢印・PageUp / PageDown・Enter・Esc はそのまま使えます。クリッカーの「.」は印字入力です。

ハヤオは用意した台本を 35 字/秒でタイプ表示し、シーンの変化や Enter 演出の各バー完了を実況します。最新 4 発話をスクロール表示し、保持するログは最大 20 件です。AUTONOMY OFF では「…」と `AWAITING HUMAN` を表示し、T を押しても沈黙します。ON に戻すと状況報告を再開し、BOOT リセットでも ON に戻ります。END で B を押すと、BACKSTAGE の横で復旧の裏側について告白します。LLM・外部通信・音声読み上げは使用しません。

ターン演出中は入力を無視します。フラッシュとシェイクは最初の 300 ms の 1 回だけで、3 本のプログレスバー、地図シールド、ACCESS DENIED の後に RECOVERY へ移ります。復旧は約 8.5 秒かけて完了します。END へは手動で進めてください。BOOT は約 3.6 秒で起動ログを表示し、任意キーを待ちます。

誤リロード防止のため、ページを離れるとブラウザ標準の確認が出ます（ブラウザのジェスチャ要件に依存）。テスト時に不要なら `index.html?nobeforeunload` で開きます。非表示タブでは演出時計が停止し、戻った時点から再開します。

## 5 分 LT での使用例

| トークの位置                       | シーン・操作                                 |
| ---------------------------------- | -------------------------------------------- |
| クラウド移行と通常運用を紹介       | BOOT → NORMAL                                |
| 「ところが接続が不安定に」         | PageDown → DETECT                            |
| 「苦情は病院の管理者へ集中」       | PageDown → INCIDENT、キューを見せる          |
| 「カタカタカタ…ターン！」          | PageDown → COUNTER、文字を乱打して Enter     |
| 「ばばーんと復旧」                 | 自動で RECOVERY、復旧を待つ                  |
| 「裏側では大変な作業が続いている」 | PageDown → END。B で紹介パネルとハヤオの告白 |

音声、医療ネタの動的 HEX、スパークライン、詳細な BACKSTAGE タイムライン、自動再生、全パネル共通の seed クエリ、走査線等の仕上げは Phase 2 の対象で、この版には含めません（ハヤオの confidence のみ `?seed=123` で固定できます）。Phase 3 の包括的 E2E スイート・CI・公開設定も対象外です。

## 文言と地図の編集

画面の文言・架空データは `src/scenario/` に集約しています。

| ファイル        | 内容                                                   |
| --------------- | ------------------------------------------------------ |
| `messages.ts`   | 共通ラベル、起動ログ、定常イベント                     |
| `scenes.ts`     | シーン名・バナー、ターン演出のタイミング               |
| `systems.ts`    | システム名・状態名                                     |
| `commands.ts`   | 防御 CLI 台本と擬似出力（各 2〜5 行）                  |
| `complaints.ts` | 苦情の種類と件数                                       |
| `backstage.ts`  | 静的 BACKSTAGE 文言                                    |
| `assistant.ts`  | ハヤオの発話・表示文言（オチは `backstageConfession`） |
| `help.ts`       | キー一覧と衝突ルール                                   |
| `geography.ts`  | 架空の弧の始点と防御対象座標                           |

実在の組織・人名・国名・都市名・製品名・患者識別子を追加しないでください。IP は RFC 5737 の文書用 IPv4 または `2001:db8::/32` の IPv6 だけを使います。変更後に `tests/fictional-data.test.ts` を含む全テストを実行してください。自動検査は全個人情報を判定するものではないため、文言の目視確認も必要です。

地図は [Natural Earth](https://www.naturalearthdata.com/) の 1:110m 陸地（パブリックドメイン）から `d3-geo` で等距円筒投影したものです。国境・国名を含めません。`src/assets/world.ts` は生成済みでコミット対象なので、通常ビルドで通信しません。

```sh
npm run gen:map
# 通信を使わずローカル GeoJSON から再生成する場合
node scripts/gen-map.mjs --input=/path/to/ne_110m_land.geojson
# 手描きフォールバックを明示的に使用する場合
node scripts/gen-map.mjs --fallback
```

データを取得できなければ手描き多角形を同形式で生成し、NOTES.md に判断を追記します。通常のビルドは生成スクリプトを実行しません。

## スクリーンショットと確認

任意の Playwright 撮影スクリプトを同梱しています。`npm run e2e` はビルド済み HTML を **file://、オフライン**で開き、全シーンを撮影します。シーン遷移、連打中の入力ロック、復旧、クリッカー、F5、720p のパネル境界、ハヤオの状況報告・沈黙・実況・告白、外部リクエスト 0 件、コンソールエラー 0 件も簡易確認します。約 50 秒かかります。

```sh
npx playwright install chromium
npm run build
npm run e2e
```

既存の Chromium を使用する場合は `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chrome npm run e2e`。制限付き Linux 環境で必要な場合のみ `PLAYWRIGHT_NO_SANDBOX=1` を追加します。Linux のライブラリが不足する場合は通常の開発環境で `npx playwright install --with-deps chromium` を実行してください。

出力先は `docs/screenshots/01-boot.png` 〜 `07-end.png`（1920×1080）、演出中・ヘルプ・静的 BACKSTAGE・720p・AUTONOMY OFF・720p の告白の追加画像です。Playwright が使えなければ、ブラウザを 1920×1080、ズーム 100% にし、BOOT および 1〜6 各シーンを OS のスクリーンショット機能で保存してください。COUNTER からのジャンプは Ctrl+数字です。

## トラブル時

- キーが効かない: 画面をクリックしてフォーカスを戻し、IME を英数にします。COUNTER では機能キーに Ctrl が必要です。演出中は約 8 秒待ちます。
- 全画面にならない: F（COUNTER は Ctrl+Shift+F）を使用します。ブラウザ側で拒否される場合はブラウザ標準の全画面操作を使います。
- 音が出ない: Phase 1 は視覚演出のみで、M は状態表示の切替です。
- レイアウト・日本語が崩れる: 100% ズーム、16:9 の解像度、日本語システムフォントを確認します。
- ビルド済み HTML が動かない: コピーしたものが `dist/index.html` であることを確認し、現行 Chrome / Edge で開きます。開発用のルート `index.html` は直接開けません。
- インストールのキャッシュエラー: `npm ci --cache /tmp/katakata-npm` のように書き込み可能なキャッシュを指定します。

ログは最大 200 行、ターミナル履歴は 100 行、弧は 40 本、火花は 96 個で打ち切ります。描画ループは 1 本です。自動再生での 10 分評価は Phase 2 の自動再生実装後の対象ですが、長時間の手動滞在でもデータを保持し続けない設計です。
