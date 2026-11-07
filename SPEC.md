# SPEC.md — 病院サイバー防衛コンソール「カタカタカタカタターン」

## 1. 背景（これを理解してから作ること）

東海医療DX研究会での LT（5 分）「医療クラウド移行の問題点とその解決に向けて」で供覧するデモ。話の流れ:

1. 厚労省の「標準型電子カルテ」はクラウドネイティブ推奨。病院の情報システム管理者不足 →「それならクラウドベンダーに面倒を見てもらえ」
2. しかしクラウド移行後、障害時に病院側の管理者は苦情対応以外やることがない。患者・医師・看護師の不満を聞くだけで、解決はクラウド屋さん任せ。実際はいろいろ大変だが、それが見えない。
3. 「キーボードをカタカタカタカタターン」
4. 「ばばーんと作ってみた」→ デモ供覧 ← ここで動かす

作るものは、ドラマやアニメに出てくるサイバー攻撃を防衛する側の派手な画面を、病院情報システムの文脈で再現した演出用ソフトウェア。障害発生中に管理者が「カタカタカタ…ターン！」とやると画面が派手に反応し「対処している感」を出す。あわせて、オチとして「見えない裏側の大変さ」を可視化するオーバーレイを持たせる。

ユーモアのデモだが、公開の場で医師が使う。したがって:

- **安全性**: 実在の IP・組織名・人名・患者情報を一切出さない（§6）。
- **安定性**: 本番 5 分間、オフライン環境・会場プロジェクタ（720p の可能性あり）で絶対に落ちない。
- **視認性**: 会場後方から読める文字サイズ。

## 2. 成果物

- リポジトリ `katakata-turn`（MIT ライセンス、LICENSE 同梱）
- `npm run build` → `dist/index.html` 単一ファイル（ダブルクリックで file:// から動作、外部通信ゼロ）
- README.md（日本語）: 起動方法、キー操作一覧、シナリオ文言の編集方法、LT 進行例（§4.3 の各シーンをトークのどの箇所で出すか）、トラブル時の対処
- 自動テスト（シナリオ状態機械・タイピングバッファ・架空データ検査）
- `docs/screenshots/` に各シーンのスクリーンショット

**非目標（やらないこと）**

実際の監視・ネットワーク通信・バックエンド・ログイン・データ永続化・モバイル対応・多言語切替。

## 3. 技術スタック（固定）

- Vite + TypeScript、UI フレームワークなし（vanilla DOM + CSS + Canvas 2D）
- `vite-plugin-singlefile` で単一 HTML 出力。`vite.config.ts` に `base: './'`。
- 実行時の外部通信ゼロ。CDN・Web フォント・外部 API・画像の外部参照を禁止。全アセット同梱。
- 効果音は Web Audio API でプログラム生成（音声ファイル不要）。
- フォントはシステムフォントのみ: `ui-monospace, "SF Mono", Menlo, Consolas, "Noto Sans Mono CJK JP", monospace`。日本語は `system-ui, "Hiragino Sans", "Noto Sans JP", "Yu Gothic UI", sans-serif`。
- テスト: vitest。E2E は Playwright を optional（`npm run e2e`、スクリーンショット撮影と「ネットワークリクエスト 0 件」検証に使う）。
- `npm run typecheck`（`tsc --noEmit`）+ Prettier。ESLint は入れなくてよい。
- Node 20 以上。依存は最小限。

## 4. 画面設計

### 4.1 全体トーン

- 16:9、1920×1080 基準でレイアウトし、1280×720 でも破綻しない（CSS Grid + vw/vh/clamp()）。4:3 はレターボックスで可。
- 暗背景にシアン/グリーン系の発光文字、警告は琥珀、危機は赤。走査線・グリッド・微グロー・ノイズ等の「それっぽい」CSS 効果。
- 点滅・フラッシュは 3 Hz 未満（光過敏対策）。全画面フラッシュは Enter 演出の 1 回のみ。
- 文字サイズ: パネル見出し 24px 以上、本文 18px 以上、重要数値 48px 以上（1080p 基準、clamp() で可変）。
- 英語大文字の等幅見出し（THREAT MAP, SYSTEM STATUS）＋ 日本語の中身、という混在がドラマ感の肝。
- 右下に常時小さく `DEMO — ALL DATA FICTIONAL / 架空データ` を表示。

デザイントークン（`src/styles/tokens.css`）:

```css
--bg: #05080f;  --panel: #0b1220;  --line: rgba(56,242,255,.25);
--fg: #9ff5e8;  --cyan: #38f2ff;   --green: #39ff88;
--amber: #ffb020; --red: #ff3b5c;  --dim: #5c7080;
```

### 4.2 パネル構成

CSS Grid で以下を配置する（番号は優先度。狭い画面では 6・7 を縮小）。

1. **HEADER**（上端帯）: タイトル `HOSPITAL CYBER DEFENSE CONSOLE`、`架空記念病院 情報システム部`、現在時刻（実時刻）、`ALERT LEVEL` 5→1（5 が平常）、現在シーン名、ミュート状態。
2. **THREAT MAP**（左上・最大面積）: 世界地図（等距円筒）上を攻撃の弧が日本へ飛ぶ。ターゲットは `CLOUD-DC-EAST`（東日本付近）と `DR-SITE-WEST`（西日本付近）の 2 点。防御後は弧が日本周辺の「シールド環」で遮断され火花が散る。
3. **SYSTEM STATUS**（右上）: 院内システム一覧。各行 = 名称 / 状態ランプ / 応答時間 ms / ミニスパークライン。
   - 対象: 電子カルテ（クラウド）、PACS、検査システム、薬剤部門、オーダリング、看護支援、医事会計、院内 LAN、閉域網/VPN、地域医療連携 NW
   - 状態: `NOMINAL` / `DEGRADED` / `DOWN` / `RECOVERING`
4. **EVENT LOG**（左下）: 流れるログ。`HH:MM:SS.mmm  LEVEL  発生源  メッセージ`。DOM ノードは最大 200 行で古い順に破棄。
5. **TERMINAL**（中央下）: hackertyper 方式（§4.4）。
6. **PACKET / HEX**（右中）: 16 進ダンプがスクロール。ASCII 列に医療情報ネタを混ぜる: HL7 v2 の `MSH|^~\&|` 断片、FHIR の `"resourceType":"Bundle"` 断片、DICOM タグ `(0008,0060)` 等。患者識別子に見える文字列は入れない。
7. **COMPLAINT QUEUE 苦情対応キュー**（右下）: スライド 3 の自虐ネタ。項目例: `医師から内線`, `看護師から`, `患者さんから（窓口）`, `医事課から「会計できない」`, `院長から`（赤で強調）。障害が進むと件数が増え、復旧で `対応済み` に流れて減る。合計件数を大きく表示。
8. **BACKSTAGE「見えない裏側」**（オーバーレイ、B キーでトグル）: 「その頃クラウド側では」というタイムライン。例:
   ```
   09:41  AZ-1 ストレージ障害を検知
   09:43  自動フェイルオーバー開始
   09:52  DB レプリカ昇格
   10:05  整合性チェック
   10:20  DNS 切替（TTL 待ち）
   10:31  復旧宣言
   ---
   病院側でやったこと:  ステータスページをリロード ×58 回 / 苦情対応 ×29 件
   ```
   文言は `src/scenario/backstage.ts` に置き、簡単に差し替えられるようにする。
9. **BANNER**（上中央オーバーレイ）: `WARNING` / `CRITICAL` / `COUNTERMEASURE DEPLOYED` / `ALL SYSTEMS NOMINAL` などの大型表示。
10. **HELP**（H or ? でトグル）: キー操作一覧。
11. **AI ASSISTANT**（右中、SYSTEM STATUS と COMPLAINT QUEUE の間）: 自律型 AI アシスタント「ハヤオ」の発話パネル（§4.6）。

### 4.3 シーン（状態機械）

```
BOOT → NORMAL → DETECT → INCIDENT → COUNTER → RECOVERY → END
```

手動進行が既定（§4.5）。自動遷移は BOOT→NORMAL（任意キー）と COUNTER→RECOVERY（ターン演出完了後）のみ。各シーンは「入った瞬間の演出」と「滞在中の環境アニメーション」を持つ。

| シーン | ALERT | 演出・状態 |
|---|---|---|
| **BOOT** | — | 起動ログがタイプ表示される（3〜4 秒、任意キーでスキップ）。例: `> loading threat intelligence ... OK` / `> mounting /dev/karte ... OK` / `> calibrating complaint queue ... OK` / `SYSTEM READY. PRESS ANY KEY.` |
| **NORMAL** 平常監視 | 5 | 全システム NOMINAL。ログは定常運用（`定期バックアップ完了`, `VPN トンネル維持`, `オーダ送信 1,204 件/分`）。地図は薄い通常トラフィック線のみ。苦情 0 件。 |
| **DETECT** 異常検知 | 4→3 | 琥珀バナー `WARNING: 異常検知`。クラウド接続 RTT 45ms → 380ms、電子カルテ DEGRADED。地図に最初の攻撃弧。`不正アクセス試行 17/min` カウンタ出現。苦情 `医師から内線 ×1`。 |
| **INCIDENT** 障害進行 | 2→1 | 赤バナー `CRITICAL: 電子カルテ 応答なし`。電子カルテ DOWN、PACS・オーダリング DEGRADED。弧が多数、HEX が加速、ログに `FIREWALL DROP 203.0.113.x` 連打。苦情が急増（`患者さんから ×12`, `院長から ×1` を赤で）。ここで演者が「カタカタカタ…」と話す。 |
| **COUNTER** 対処 | 1 | 演者がキーを乱打 → TERMINAL にコマンドが流れる。Enter で「ターン！」（§4.4）。完了後 RECOVERY へ自動遷移。 |
| **RECOVERY** 復旧 | 1→5 | システムが RECOVERING→NOMINAL に 1 つずつ戻り、その都度ログ。弧がフェードアウト。苦情が `対応済み` に流れて 0 へ。緑バナー `ALL SYSTEMS NOMINAL / 復旧完了`。 |
| **END** | 5 | 静かな状態。B で BACKSTAGE を出してオチにする（自動では出さない）。 |

### 4.4 「カタカタ…ターン！」仕様

- 任意の印字キー（Space 含む）: 1 打鍵につき 3〜6 文字（シード付き乱数）を TERMINAL の現在行に出力。行が完成したら 80〜200 ms 後にその行の擬似出力（2〜5 行）を自動表示。コマンド台本は `src/scenario/commands.ts` に配列で持ち、循環する。
- コマンドは架空の防御側 CLI（`soc-cli`, `fw-ctl`, `ids-ctl`, `dr-ctl`, `karte-ctl`）で構成。実在の攻撃ツール名・エクスプロイトは一切出さない。例:
  ```
  $ soc-cli threats --live --region jp-east
  $ fw-ctl isolate --segment karte-cloud-link --reason "anomalous ingress"
  $ ids-ctl signatures reload --profile hospital-strict
  $ dr-ctl failover --to dr-site-west --confirm
  $ karte-ctl health --deep
  ```
- **Enter**:
  - **COUNTER シーン**: 本番演出。現在行を即完成 → 画面 1 回フラッシュ＋シェイク（300 ms）→ 巨大バナー `COUNTERMEASURE DEPLOYED` → プログレスバー 3 本を順に（`ISOLATE SEGMENT` / `FAILOVER TO DR SITE` / `PURGE SESSIONS`、各 1.5〜2.5 秒）→ 地図の弧がシールド環で遮断・火花 → `ACCESS DENIED` の斜めスタンプ → 効果音 → RECOVERY へ。全体 7〜9 秒。
  - **他シーン**: 小演出のみ（バナー `COMMAND ACCEPTED`、短いビープ）。
- 連打・演出中の入力で壊れない（演出中は入力を無視、終了後に受け付け）。

### 4.5 キー操作

プレゼン用クリッカー（PageUp/PageDown、F5、`.`）での進行を想定する。

| キー | 動作 |
|---|---|
| PageDown, → | 次のシーン |
| PageUp, ← | 前のシーン |
| 1〜6 | シーンへジャンプ（1=NORMAL … 6=END） |
| Enter | ターン！（§4.4） |
| 印字キー | TERMINAL にコマンド出力 |
| B | BACKSTAGE トグル |
| H, ? | ヘルプ |
| M | ミュート |
| A | 自動再生（各シーン 20 秒で進行、リハーサル・無人展示用） |
| R | リセット（BOOT へ） |
| F | フルスクリーン |
| Esc | オーバーレイを閉じる |
| F5 | preventDefault（クリッカーの F5 でリロードさせない） |

**文字キーと機能キーの衝突ルール**（単一ルールで解決し、ヘルプにそう書く）: COUNTER 以外のシーンでは単独キーが機能キー、COUNTER 中は印字キーはすべて TERMINAL 入力となり、機能は Ctrl+ 修飾で呼ぶ（Ctrl+B, Ctrl+M, Ctrl+1… ただし Ctrl+R と Ctrl+F はブラウザ機能と衝突するため COUNTER 中は Ctrl+Shift+R / Ctrl+Shift+F）。`beforeunload` で離脱確認を出す（誤リロード防止、`?nobeforeunload` クエリで無効化可）。

### 4.6 自律型 AI アシスタント「ハヤオ」

**位置づけ**: ドラマで司令室に必ずいる「AI が喋る」演出。画面右側、SYSTEM STATUS と COMPLAINT QUEUE の間に
AI ASSISTANT パネルを置く（720p では COMPLAINT QUEUE と縦に分け合う）。

**表示**
- ヘッダ `AI ASSISTANT // HAYAO  v0.1  [AUTONOMOUS MODE]`、右に `AUTONOMY: ON/OFF`。
- 吹き出し風の発話ログ（最新 4 件）。1 文字ずつタイプ表示（30〜40 字/秒）、文末にカーソル点滅（2 Hz 以下）。
- 発話の下に「思考中」インジケータ（`analyzing ░░▒▒▓▓`）と `confidence: 0.87` のような数値。数値は演出用の乱数。
- アイコンは幾何学図形（同心円＋回転する弧）を Canvas で描く。既存キャラクターやロゴに似せない。

**ふるまい（シーン連動、文言は src/scenario/assistant.ts に集約）**
- NORMAL: 平常報告。「異常なし。定期バックアップは 03:00 に完了しています。」
- DETECT: 先に気づく。「クラウド接続の RTT が 8 倍に増加。電子カルテ応答遅延を検知しました。」
- INCIDENT: 対処案を列挙するが、自律では実行しない。
  「推奨: セグメント隔離・DR サイト切替。実行には管理者の承認が必要です（Enter）。」
  苦情が増えると「院長からの内線を検知。優先度を CRITICAL に引き上げます。」
- COUNTER: 演者のキー乱打に反応。「コマンドを受理… 構文を補完しています。」
  Enter の「ターン！」演出中は進捗バーに合わせて実況。「セグメント隔離 完了」「DR サイトへ切替 完了」
- RECOVERY: 「全システム正常。インシデントレポートを自動生成しました。」
- END（BACKSTAGE 表示時）: オチ。
  「補足: 本インシデントの実際の復旧作業はすべてクラウド側で行われました。私が行ったのは状況の読み上げです。」
  この一文は `assistant.ts` の `backstageConfession` として差し替え可能にする。

**キー操作**
- `T`（COUNTER 中は `Ctrl+T`）: ハヤオに「状況報告」を喋らせる（現在シーンの要約を 1 文）。トークの間が空いたときの埋め用。
- `Ctrl+Shift+A`: AUTONOMY を OFF にすると、ハヤオの発話が「…」と沈黙し、ステータスが `AWAITING HUMAN` になる（小ネタ）。

**制約**
- 発話は全部あらかじめ用意した文言。LLM・外部通信は使わない（§3 を維持）。
- 文言は §6 の架空データルールに従う。実在の AI 製品名・会社名は出さない。
- 発話ログは最大 20 件で破棄。

**受け入れ基準の追加**
- [ ] 各シーンで少なくとも 1 発話が自動で出る。Enter 演出中の実況が進捗バーと同期している
- [ ] `T` で任意のタイミングに発話できる。AUTONOMY OFF で沈黙する
- [ ] 発話文言が tests/fictional-data.test.ts の検査対象に含まれる

## 5. アーキテクチャ

```
katakata-turn/
  AGENTS.md  SPEC.md  NOTES.md  README.md  LICENSE  package.json  vite.config.ts  index.html
  scripts/gen-map.mjs            # Natural Earth → src/assets/world.ts 生成（§6）
  src/
    main.ts                      # 起動・ループ・パネル組立
    engine/scenario.ts           # 状態機械（純粋ロジック、DOM 非依存）
    engine/clock.ts              # rAF ループと経過時間
    engine/rng.ts                # シード付き PRNG（テスト決定性のため）
    engine/events.ts             # 軽量 EventEmitter
    input/keymap.ts              # キー → アクション
    input/typing.ts              # hackertyper バッファ（純粋ロジック）
    audio/sfx.ts                 # Web Audio 効果音（key click / beep / turn / chime）
    panels/{header,threatMap,systemStatus,eventLog,terminal,hexdump,complaints,backstage,banner,help,assistant}.ts
    scenario/{scenes,systems,messages,commands,complaints,backstage,assistant}.ts   # 文言・データ（ここだけ触れば演出内容を変えられる）
    assets/world.ts              # 地図パスデータ
    styles/{tokens,layout,effects,panels}.css
  tests/                         # vitest
  e2e/                           # playwright（optional）
  docs/screenshots/
```

- ロジックと描画の分離: `engine/` と `input/` は DOM に触らず、`panels/` が購読して描画する。これによりシナリオと入力バッファを vitest で検証できる。
- 描画は Canvas（地図・スパークライン・HEX）と DOM（ログ・ステータス・バナー）の併用。1 本の requestAnimationFrame ループで統一。
- 乱数は全て `engine/rng.ts` 経由。`?seed=123` クエリで固定可能。
- パフォーマンス: 10 分放置（自動再生）でメモリが増え続けないこと。ログ・HEX・弧の配列は上限付き。

## 6. データと安全ルール（必須）

- IPv4 は RFC 5737 の文書用アドレスのみ: `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`。IPv6 は `2001:db8::/32` のみ。
- 実在の国名・都市名・組織名・製品名（クラウドベンダー名含む）・人名を出さない。攻撃元ラベルは `UNKNOWN`, `BOTNET-NODE-xx`, `TOR-EXIT-xx`, `RELAY-xx`。弧の始点は海上を含む架空座標リストから選ぶ。
- 病院名は `架空記念病院`。患者情報・患者 ID・氏名・生年月日に見えるものは一切出さない。
- 実在のマルウェア名・攻撃手法の具体的手順・エクスプロイトコードを出さない。防御側の架空 CLI のみ。
- `tests/fictional-data.test.ts` で `src/scenario/**` の全文字列を走査し、文書用レンジ外の IPv4 パターン、および禁止語リスト（主要クラウドベンダー名・主要国名）が含まれないことを自動検査する。
- 地図: Natural Earth 1:110m（パブリックドメイン）の国境なし陸地データを `scripts/gen-map.mjs`（`d3-geo` を devDependency）で equirectangular に投影し、`src/assets/world.ts` にパス文字列として生成物をコミットする（ビルド時のネットワーク不要）。開発環境でダウンロードできない場合は、大陸を粗い多角形で手描きしたフォールバックを同じ形式で作り、NOTES.md に記録する。地図に国境線・国名は描かない。

## 7. 受け入れ基準（全フェーズ共通のチェックリスト）

- [ ] `npm ci && npm run build` が成功し、`dist/index.html` が単一ファイル・2 MB 未満
- [ ] `dist/index.html` を Chrome / Edge で file:// から開いて動作、コンソールエラー 0
- [ ] 起動後、外部へのネットワークリクエストが 0 件
- [ ] 1920×1080 と 1280×720 の両方でレイアウト破綻なし
- [ ] キーボードだけで BOOT→END を 3 分以内に通せる
- [ ] COUNTER で Enter → 演出 → RECOVERY に自動遷移する。演出中の連打で壊れない
- [ ] F5 でリロードされない。クリッカー相当（PageUp/PageDown）で進む
- [ ] フラッシュ・点滅は 3 Hz 未満
- [ ] `npm test` 緑（状態機械・タイピングバッファ・架空データ検査）
- [ ] 自動再生で 10 分放置してもフレームレート低下・メモリ増大がない（概算で可）
- [ ] README に起動手順・キー一覧・LT 進行例・文言編集方法・トラブル対処がある

## 8. フェーズ

### Phase 1 — MVP（最優先、これだけで本番可能にする）

1. リポジトリ初期化（Vite + TS、Prettier、vitest、MIT、package.json の scripts: dev / build / preview / typecheck / test / e2e）
2. `engine/scenario.ts` + `input/typing.ts` + テスト
3. レイアウトと全パネルの静的表示（トークン・グリッド・1080p/720p）
4. シーン別の演出: HEADER / SYSTEM STATUS / EVENT LOG / BANNER / COMPLAINT QUEUE
5. THREAT MAP（地図生成スクリプト、弧アニメーション、シールド遮断）
6. TERMINAL（hackertyper）と Enter の「ターン！」演出一式
7. キー操作一式（クリッカー対応、F5 抑止、beforeunload）
8. 単一 HTML ビルド、README 初版、スクリーンショット

### Phase 2 — 演出強化

1. Web Audio 効果音（キークリック / 警告ビープ / ターン / 復旧チャイム）、ミュート、初回ジェスチャ後に AudioContext を resume
2. HEX ダンプの医療情報ネタ、スパークライン
3. BACKSTAGE オーバーレイ
4. 自動再生モード、`?seed=` 固定
5. 走査線・グロー・ノイズなどの仕上げ効果（3 Hz 未満を守る）

### Phase 3 — 仕上げ

1. Playwright E2E（各シーンのスクリーンショットを `docs/screenshots/` に保存、ネットワーク 0 件検証）
2. README 完成（LT 進行例、文言編集ガイド、トラブル時の対処: 音が出ない／フルスクリーンにならない等）
3. GitHub Actions で build と test（optional）。GitHub Pages 公開は optional
4. NOTES.md の整理、既知の問題の列挙
