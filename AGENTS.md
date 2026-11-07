# AGENTS.md
- 仕様の正本は SPEC.md。矛盾があれば SPEC.md を優先し、判断は NOTES.md に記録する。
- 実行時の外部通信は禁止。依存追加は最小限、追加時は理由を NOTES.md に書く。
- コミットは Conventional Commits、小さく。
- 変更後は必ず `npm run typecheck && npm test && npm run build` を通す。
- 架空データルール（SPEC.md §6）を破らない。tests/fictional-data.test.ts を常に緑に保つ。
- UI 文言は src/scenario/ に集約。パネル実装にリテラル文言を書かない。
- 点滅は 3 Hz 未満。全画面フラッシュは Enter 演出の 1 回のみ。
- 質問はしない。曖昧点は単純な方を選び NOTES.md に記録する。
