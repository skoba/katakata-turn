# カタカタカタカタターン

架空記念病院の「対処している感」を出す、5 分 LT 用サイバー防衛コンソール。実際の監視・攻撃・患者情報の処理は行いません。実行時は外部通信ゼロ、表示は架空データです。AI アシスタント「ハヤオ」も台本による演出です。

Phase 3 まで実装済み。仕様の正本は [SPEC.md](SPEC.md)、現在の実装判断は [NOTES.md](NOTES.md)、ライセンスは [MIT](LICENSE) です。

## 起動方法

Node.js 20.19 以上の 20 系、または 22.12 以上と npm を使用します（CI は Node 22）。依存のインストールは事前にネット接続のある開発環境で行ってください。

```sh
npm ci
npm run dev
```

表示されたローカル URL を Chrome / Edge で開きます。

本番用は次を実行し、**`dist/index.html` をダブルクリックして file:// で開きます**。配布はこの 1 ファイルだけで、サーバー・ネット接続・追加アセットは不要です。ビルドは単一 HTML・2 MB 未満を E2E でも検査します。

```sh
npm run typecheck && npm test && npm run build
```

1920×1080 / 1280×720 の 16:9、ズーム 100% を推奨します。4:3 はレターボックス表示です。日本語システムフォントを用意してください。会場入り前にファイルをコピーし、ネットを切って一度通しておくと安心です。

## キー操作

| キー                 | 操作                                                             |
| -------------------- | ---------------------------------------------------------------- |
| 任意キー（BOOT）     | 起動ログをスキップして NORMAL へ                                 |
| PageDown / →         | 次のシーン                                                       |
| PageUp / ←           | 前のシーン                                                       |
| 1〜6                 | NORMAL / DETECT / INCIDENT / COUNTER / RECOVERY / END へジャンプ |
| 印字キー・Space      | 防御側の架空コマンドを 3〜6 文字ずつ入力                         |
| Enter                | COUNTER では 8 秒のターン演出、他では COMMAND ACCEPTED           |
| B                    | BACKSTAGE の開閉                                                 |
| H / ?                | ヘルプの開閉                                                     |
| M                    | ミュートの切替                                                   |
| A                    | 自動再生 ON / OFF（各シーン 20 秒）                              |
| T                    | ハヤオが現在シーンの状況を 1 文で報告                            |
| Ctrl+Shift+A         | ハヤオの AUTONOMY ON / OFF                                       |
| R                    | BOOT へリセット（自動再生解除・AUTONOMY ON）                     |
| F                    | フルスクリーンの開始・終了                                       |
| Esc                  | HELP / BACKSTAGE を閉じる                                        |
| F5 / Ctrl+R / Meta+R | リロード抑止                                                     |

**COUNTER 中の印字キーはすべて TERMINAL 入力**です。機能は Ctrl+B / Ctrl+H / Ctrl+M / Ctrl+A / Ctrl+T / Ctrl+1〜6 等で呼びます。リセットは **Ctrl+Shift+R**、全画面は **Ctrl+Shift+F**。AUTONOMY は全シーンで Ctrl+Shift+A。矢印・PageUp / PageDown・Enter・Esc はそのまま使えます。クリッカーの「.」は印字入力です。

BOOT は約 3.6 秒で表示を終え、任意キーを待ちます。既定は手動進行。COUNTER の Enter 演出だけは約 8 秒後に自動で RECOVERY へ移り、約 8.5 秒で全サービスが復旧します。演出中のキー入力は無視します。END へは PageDown で進み、BACKSTAGE は自動表示しません。

A は NORMAL から始めると操作しやすく、COUNTER で自動入力・Enter 演出を行い、END の 20 秒後に NORMAL へ周回します。自動再生中の手動移動は、移動先から 20 秒を数え直します。COUNTER 中の停止は Ctrl+A（演出中は終了まで待つ）。非表示タブでは演出時計と音が止まります。

効果音は小音量 ON で始まり、最初のキーで AudioContext を生成します。M は再生中の音も消します。音声読み上げはありません。誤リロード防止の離脱確認はブラウザのジェスチャ要件に依存し、`index.html?nobeforeunload` で無効にできます。`?seed=123` はタイピング・粒子・confidence・HEX・スパークラインの乱数を固定します（実時計は固定しません）。

## 5 分 LT 進行例

SPEC.md §1 の 4 段の話に対応させた例です。開始前に BOOT を開き、H でキーを確認しておきます。

| 話の段・目安    | トークと見せどころ                                                                                                   | シーンとキー                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1（0:00〜1:00） | 厚労省の「標準型電子カルテ」はクラウドネイティブ推奨。病院の管理者不足から「クラウドベンダーに面倒を見てもらおう」。 | BOOT → 任意キーで NORMAL。正常な構成図を背景に説明。                                                                |
| 2（1:00〜2:30） | 移行後に障害が起きると、病院側は患者・医師・看護師の苦情を聞き、解決を待つ立場に。裏の作業は見えない。               | PageDown で DETECT、もう一度で INCIDENT。苦情キューと THREAT INTEL の「調査中」・リロード件数を示す。               |
| 3（2:30〜3:00） | 「キーボードをカタカタカタカタターン」。                                                                             | PageDown で COUNTER、文字・Space を乱打して Enter。8 秒のバー・シールド・DR 切替・ACCESS DENIED を見せる。          |
| 4（3:00〜5:00） | 「ばばーんと作ってみた」→ デモ供覧。派手な対処を見せ、最後に見えない裏側を説明する。                                 | 自動で RECOVERY、約 8.5 秒待って PageDown で END。B で BACKSTAGE のクラウド側復旧タイムラインと病院側の集計を表示。 |

- **ハヤオ（§4.6）**: NORMAL / DETECT の T は説明の間を埋める状況報告。INCIDENT では対処案を述べ、Enter 演出は各バーの完了を実況します。COUNTER は Ctrl+T。Ctrl+Shift+A で沈黙する小ネタも使えます。END の B では「私が行ったのは状況の読み上げです」と告白し、オチを補います。
- **THREAT INTEL（§4.7）**: 第 2 段で、病院側が見ている注意喚起とステータスページを示します。INCIDENT は「調査中」のまま更新時刻とリロード件数だけが増加。RECOVERY で「復旧」に変わります。外部情報も通信しない架空のフィードです。
- **BACKSTAGE**: 第 4 段の締めに B。「その頃クラウド側では」の復旧作業と、病院側のリロード・苦情対応の差を示します。THREAT INTEL とリロード件数を共有し、全キュー復旧後の苦情対応は ×29。台本上の固定時刻と、当日の操作で増えた件数は独立です。

## 文言編集ガイド

UI 文言・架空データは `src/scenario/` に集約しています。パネル実装に直接文言を追加せず、以下の台本を編集します。

| ファイル        | 役割                                                           |
| --------------- | -------------------------------------------------------------- |
| `messages.ts`   | 共通ラベル、起動ログ、イベントログ、復旧メッセージ             |
| `scenes.ts`     | シーン名・バナー、ターン演出の時間・進捗段階                   |
| `systems.ts`    | システム名・状態名                                             |
| `commands.ts`   | 防御側 CLI と擬似出力（各 2〜5 行、配列を循環）                |
| `packets.ts`    | HEX の医療プロトコル ASCII 断片                                |
| `complaints.ts` | 苦情の種類とシーン別件数                                       |
| `backstage.ts`  | 裏側の固定タイムラインと集計ラベル                             |
| `assistant.ts`  | ハヤオの発話・状況報告・表示文言。オチは `backstageConfession` |
| `intel.ts`      | 注意喚起、架空クラウドの状態、更新・リロード間隔               |
| `topology.ts`   | 構成図ノード・リンクの固定座標、名称、攻撃経路                 |
| `help.ts`       | キー一覧と COUNTER の衝突ルール                                |

SPEC.md §6 の架空データルールを守ってください。

- IPv4 は文書用 `192.0.2.0/24` / `198.51.100.0/24` / `203.0.113.0/24`、IPv6 は `2001:db8::/32` だけ。
- 病院名は「架空記念病院」。実在の国・都市・企業・製品（クラウドベンダー含む）・人名、患者情報・患者 ID・氏名・生年月日に見える文字列は禁止です。
- **公的機関名の例外は ADVISORY の出典ラベルのみ**。`JPCERT/CC` / `IPA` / `厚生労働省` / `NISC` を使えます。本文は一般的な架空要約に限定し、実在の文書番号・日付・URL・製品名・脆弱性識別子を入れず、「要約は架空 / FICTIONAL SUMMARY」の表示を維持します。
- クラウドは「クラウド基盤 A/B」など架空名、攻撃元は `UNKNOWN` / `BOTNET-NODE-xx` / `TOR-EXIT-xx` / `RELAY-xx`。実在マルウェア名・攻撃の具体的手順・エクスプロイトを使わず、防御側の架空 CLI だけにします。地図・ロゴは使いません。
- `MSH|^~\&|`、FHIR の構造断片、DICOM タグ等も患者セグメント・識別子を追加しないでください。

編集後は `npm run typecheck && npm test && npm run build`。`tests/fictional-data.test.ts` は全台本の文字列・IP・禁止語・公的機関ラベルの位置を検査しますが、あらゆる個人情報を検出するものではないので目視も必要です。表示領域や長さを変えたら `npm run e2e` で両解像度を確認してください。本文 18 px を基本とし、低優先度の PACKET / HEX は 1080p で 16.2 px、構成図ラベルは 720p でも 13 px 以上です。カーソルは 1 Hz、全画面フラッシュは Enter 冒頭 1 回だけです。

## E2E・スクリーンショット・CI

初回のみブラウザをインストールします。アプリの実行と E2E はオフラインで動作します。

```sh
npx playwright install chromium
npm run build
npm run e2e
```

`npm run e2e` は Playwright で配布物を **file://・オフライン**で開き、撮影検証と既存の詳細検証を続けて実行します。実時間の撮影部分と仮想時間の周回・10 分検証を含み、通常は数分かかります。

- BOOT / NORMAL / DETECT / INCIDENT / COUNTER / ターン演出中 / RECOVERY / END / HELP / BACKSTAGE を 1920×1080 で撮影。
- 1280×720 の代表シーン（INCIDENT / ターン演出中 / END / BACKSTAGE）も撮影。
- 全ページの外部通信試行 0 件（WebSocket 含む）、コンソールエラー・未処理エラー 0 件、単一 HTML・2 MB 未満を検証。
- F5 後に同じ文書を維持、PageUp / PageDown、手動 BOOT→END が 3 分以内、演出中の連打入力ロック、RECOVERY 自動遷移を検証。
- 両解像度でパネル境界・主要内容・構成図ラベルの重なり、PACKET / HEX の 16 px 以上（1080p）と列の収まり、EVENT LOG の完全な 3 件以上を検証。
- ハヤオの発話・沈黙・バー同期・告白、音声生成とミュート、共有集計、seed 再現性、自動再生 1 周（NORMAL に戻るまで）を検証。
- 10 分相当を固定 16 ms rAF で全フレーム進め、DOM・ログ・フィード・粒子数と GC 後のヒープ増加上限を検証。

画像は [docs/screenshots/](docs/screenshots/) に上書き保存します。

| 画像                                                    | シーン・解像度                            |
| ------------------------------------------------------- | ----------------------------------------- |
| `01-boot.png` 〜 `07-end.png`                           | BOOT〜END、1920×1080                      |
| `05b-counter-deployed.png`                              | ターン演出中、1920×1080                   |
| `08-help.png` / `09-backstage.png`                      | HELP / BACKSTAGE、1920×1080               |
| `11-assistant-autonomy-off.png`                         | ハヤオ OFF、1920×1080                     |
| `10-end-720p.png` / `12-assistant-backstage-720p.png`   | END / BACKSTAGE、1280×720                 |
| `13-incident-720p.png` / `14-counter-deployed-720p.png` | INCIDENT / ターン演出中、1280×720         |
| `15-phase2-backstage-{1920,1280}.png`                   | 共有集計 ×58 / ×29 の BACKSTAGE、両解像度 |

`npm run e2e:phase2` は音声・seed・周回・保持上限の詳細検証だけを再実行する互換コマンドです。CI は [.github/workflows/ci.yml](.github/workflows/ci.yml) で push / pull request 時に Node 22 の `npm ci && npm run typecheck && npm test && npm run build` を実行します。E2E はローカル検証、GitHub Pages 公開設定はありません。

## トラブル時の対処

- **キーが効かない**: 画面をクリックしてフォーカスを戻し、IME を英数にします。COUNTER の機能には Ctrl が必要です。ターン演出中は約 8 秒待ちます。
- **音が出ない**: フォーカスしてキーを押し、SOUND ON 表示、M、OS・ブラウザ・出力機器の音量を確認。音声を拒否されても画面は動作し、次のキーで resume を再試行します。非表示タブは消音します。
- **フルスクリーンにならない**: F（COUNTER は Ctrl+Shift+F）。拒否される場合はブラウザ標準の全画面操作を使います。
- **レイアウト・日本語が崩れる**: 100% ズーム、16:9 の解像度、日本語システムフォントを確認します。
- **HTML が起動しない**: ルートの開発用 `index.html` ではなく、ビルド後の `dist/index.html` を現行 Chrome / Edge で開きます。
- **離脱確認が出る**: 誤操作防止の仕様です。検証時は `?nobeforeunload` で無効化できます。
- **npm キャッシュに書けない**: `npm ci --cache /tmp/katakata-npm` のように書き込み可能なキャッシュを指定します。
- **Playwright のブラウザが見つからない**: `npx playwright install chromium` で現在の依存と対応する版を用意。既存ブラウザを使う場合は `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chrome npm run e2e`。
- **Ubuntu 26.04 で Playwright が起動しない**: **`PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64` が必要**です。インストール時・実行時とも指定してください。

  ```sh
  PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64 npx playwright install chromium
  PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64 npm run e2e
  ```

- **Linux の共有ライブラリ不足**: 通常の開発環境で `npx playwright install --with-deps chromium`（Ubuntu 26.04 は上記 override も指定）。制限付き環境では管理者がライブラリと日本語フォントを用意してください。用意済みフォントは `FONTCONFIG_FILE=/path/to/fonts.conf` でも指定できます。
- **Chromium の sandbox / 設定ディレクトリで失敗する**: 必要な制限付き環境だけ `PLAYWRIGHT_NO_SANDBOX=1`、書き込み可能な `XDG_CONFIG_HOME=/tmp/katakata-browser-config` を指定します。

## 既知の問題

- 自動検証は同梱 Chromium を使用します。製品版 Chrome / Edge それぞれの GUI と、会場プロジェクタでの見え方はこの環境で確認できていません。
- 10 分の自動再生検証は仮想時間の保持上限検証です。実機での実時間 FPS・音の聞こえ方・音量は本番前にリハーサルしてください。
- システムフォント、音声開始、フルスクリーン、離脱確認は OS / ブラウザ設定に依存します。エラー時も視覚演出を継続します。
- COUNTER の機能キーは Ctrl 修飾が必要です。IME 入力中やブラウザ外にフォーカスがある場合のキー操作は対象外です。4:3 は余白付き表示、モバイルは対象外です。
