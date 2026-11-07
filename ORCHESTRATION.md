# ORCHESTRATION.md

Claude Code（プランナー / レビュアー / 検証者）が Codex CLI（実装担当）へ委譲した記録。

## 環境

- 2026-11-07 環境確認: WSL2 Ubuntu。`node` / `npm` / `codex` が PATH に無かった。
  - Node v22.23.4（LTS）を `~/.local/node` に展開し `~/.local/bin` へ symlink（sudo 不要、削除で元に戻る）。
  - Codex CLI は VS Code 拡張 `openai.chatgpt` 同梱の `codex-cli 0.164.0-alpha.11.1` を `~/.local/bin/codex` に symlink。ChatGPT ログイン済み。
  - 委譲方式: **`codex exec`（非対話 CLI）**。MCP サーバ経由ではない（`claude mcp list` に codex は無し）。
- `codex exec` の実フラグ（このバージョンには `--full-auto` / `-a` は無い）:
  `codex exec -C <repo> -s workspace-write -c 'sandbox_workspace_write.network_access=true' -c 'model_reasoning_effort="high"' --add-dir ~/.npm --add-dir ~/.cache -o <last.md> - < tasks/phaseN.md`
- タスクプロンプトとログは `../katakata-turn-work/{tasks,logs}/` に置く（Codex の作業ツリーを汚さないため）。

## Phase 1

| 投入 | 開始 | 終了 | 所要 | 備考 |
|---|---|---|---|---|
| #0（失敗） | 12:xx | 即時 | — | `-a never` が exec では未サポートで起動失敗 |
| #0'（中断） | 12:xx | 20 秒 | — | `reasoning effort: none` で起動したため中断し、未コミット生成物を `git clean` で破棄 |
| #1 初回 | 12:11 | 12:32 | 21 分 | reasoning effort high。14 コミット（/tmp の影リポジトリ → fast-forward 取込）。レビュー ❌ 0 件、修正往復 0 回 |

### Codex の失敗パターン
- `workspace-write` サンドボックスでは `.git` が書込不可 → Codex は自力で `/tmp/katakata-turn-phase1.git` に影リポジトリを作りコミット。以降のタスクでは `GIT_DIR`/`GIT_WORK_TREE` を環境変数で影リポジトリに向けて渡す。
- `~/.npm` が存在しない状態で `--add-dir ~/.npm` を渡したため npm キャッシュ書込に失敗 → Codex は `--cache /tmp/katakata-npm` で回避。以降は `~/.npm` 作成済み。
- Playwright が Ubuntu 26.04 を未対応と判定 → Codex は自力で回避（Chromium / フォント / libasound を /tmp に展開）。レビュー側は `PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64` と `~/.local/lib/libasound.so.2` で対処。
- 初回（#0'）は `reasoning effort: none` で起動したため中断。`-c model_reasoning_effort="high"` を必須とする。

## Phase 1b（§4.6 AI ASSISTANT 差分タスク）

| 投入 | 開始 | 終了 | 所要 | 備考 |
|---|---|---|---|---|
| #1 初回 | 12:41 | 12:51 | 10 分 | tasks/phase1b-assistant.md。GIT_DIR/GIT_WORK_TREE で影リポジトリに直接コミット（3 コミット）。レビュー ❌ 0 件、修正往復 0 回 |


## Phase 1c（世界地図 → NETWORK TOPOLOGY、THREAT INTEL、公的機関名の許可）

| 投入 | 開始 | 終了 | 所要 | 備考 |
|---|---|---|---|---|
| #1 初回 | 13:06 | 13:18 | 12 分 | tasks/phase1c-topology.md。5 コミット。レビューで ❌ 2 件（DR ノードの状態共有、EVENT LOG 上端の部分行） |
| #2 修正 | 13:21 | 13:24 | 3 分 | tasks/phase1c-fix1.md。3 コミット。❌ 0 件 |

## Phase 2（演出強化）

| 投入 | 開始 | 終了 | 所要 | 備考 |
|---|---|---|---|---|
| #1 初回 | 13:32 | 13:50 | 18 分 | tasks/phase2.md。5 コミット。レビュー ❌ 0 件、修正往復 0 回。自動再生 10 分ソーク合格 |

## Phase 3（仕上げ）

| 投入 | 開始 | 終了 | 所要 | 備考 |
|---|---|---|---|---|
| #1 初回 | 14:04 | 14:14 | 11 分 | tasks/phase3.md。4 コミット。レビュー ❌ 0 件、修正往復 0 回 |

## 総括（2026-11-07）

- Codex 投入 7 回（Phase 1 / 1b / 1c / 1c 修正 / 2 / 3 ＋ 起動失敗・中断 2 回）、実装時間の合計約 85 分。修正往復は Phase 1c の 1 回のみ。
- Claude Code が自分で書いたコードはなし。環境整備（Node / Codex / Playwright 回避策）、SPEC 改訂、レビュー、GitHub 公開のみ。
- 同梱 E2E をこの環境で動かすには `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=~/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome PLAYWRIGHT_NO_SANDBOX=1 XDG_CONFIG_HOME=/tmp/katakata-browser-config FONTCONFIG_FILE=/tmp/katakata-fonts.conf LD_LIBRARY_PATH=~/.local/lib npm run e2e`。
