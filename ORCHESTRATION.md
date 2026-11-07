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
| #1 初回 | （logs/phase1.start） | | | reasoning effort high |

### Codex の失敗パターン
- （記録中）
