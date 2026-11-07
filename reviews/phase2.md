# Phase 2 レビュー（演出強化）

対象: HEAD `acc567c`（Codex 5 コミット、53 files / +1287 −127）。検証: `reviews/phase2/*.png`、`katakata-turn-work/review/{phase2,soak2,capture}.mjs`。
typecheck ✅ / test 44 件 ✅ / build ✅ dist 55 KB / コンソールエラー 0 / 外部リクエスト 0 / F5 抑止 ✅ / Enter → RECOVERY ✅。

## §8 Phase 2 項目

| # | 項目 | 判定 | 根拠 |
|---|---|---|---|
| 1 | Web Audio 効果音、ミュート、初回ジェスチャ後 resume | ✅（コード検証） | `src/audio/sfx.ts`: keydown でのみ AudioContext 生成・resume、失敗しても演出継続、M は共有ゲインを 0、非表示タブで一時停止、同時発音 24 上限。key / beep / warning / turn / chime の 5 種をプログラム生成。ヘッダ表示 MUTED ⇔ SOUND ON を確認。**聴感は実機未検証** |
| 2 | HEX の医療情報ネタ、スパークライン | ✅ | HEX は `MSH\|^~\&\|` / `"resourceType":"Bundle"` / `(0008,0060) MODALITY` / `ACK\|DEMO\|OFFLINE` の断片のみ（患者識別子なし）、INCIDENT/COUNTER で 120 ms、他 650 ms ごとに 1 行、24 行上限。SYSTEM STATUS 各行に応答時間のスパークライン（36 点上限） |
| 3 | BACKSTAGE オーバーレイ | ✅ | 6 行のタイムライン（`src/scenario/backstage.ts` で差替可）＋「病院側でやったこと: ステータスページをリロード ×N / 苦情対応 ×29 件」。リロード件数は THREAT INTEL と共有、苦情対応件数は実際に解消した件数 |
| 4 | 自動再生、`?seed=` | ✅ | A で各シーン 20 秒進行（COUNTER は自動入力後 Enter、END → NORMAL 周回、R で解除）。`?seed=42` で 2 回起動した結果（confidence 等）が一致。乱数は用途別ストリームに分配 |
| 5 | 走査線・グロー・ノイズ | ✅ | 静止 CSS テクスチャ（`.console::after`）と固定影のみ。CSS アニメーションは turn-flash / turn-shake（1 回）とハヤオのカーソル 1 Hz だけ |

## 追加指示（Phase 1 所見）

- ALERT LEVEL 推移: DETECT 4→3（3 秒後）、INCIDENT 2→1（3 秒後）、RECOVERY 1→5（2.125 秒刻み）を確認 ✅
- リロード加速: 510 ms 間隔（INCIDENT 30 秒で約 ×58）、BACKSTAGE と一致 ✅
- 右列配分: SYSTEM STATUS 行間 27 px、720p でハヤオの発話 3〜4 件表示 ✅

## §7 長時間基準

- 自動再生 10 分ソーク（Playwright、1080p）: heap 1.3 → 2.0 → 1.4 MB で増加傾向なし、DOM 730 → 1,366 → 1,344 で頭打ち、エラー 0。✅

## 所見（Phase 3 で対応）

- PACKET / HEX の文字が 1080p で約 14 px と §4.1 の本文 18 px を下回る。優先度の低いパネルだが 1080p では 16 px 以上にしたい。
- EVENT LOG が 2 行強しか見えず「流れるログ」の密度が落ちた。行間を詰めるか、THREAT INTEL との高さ配分を調整したい。

## 判定

❌ 0 件。差し戻しなし。
