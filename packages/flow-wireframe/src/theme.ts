/**
 * 出力 HTML に埋め込む CSS。
 * 外部フォント・外部リソースへの参照を持たず、file:// 直開きでも完全に動作する。
 * 印刷（A4）にも配慮する。
 */
export function buildCss(accent = "#2563eb"): string {
  return `
:root {
  --accent: ${accent};
  --ink: #1f2937;
  --muted: #6b7280;
  --line: #d1d5db;
  --paper: #f8fafc;
  --sketch: #9ca3af;
  --good: #047857;
  --caution: #b45309;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  color: var(--ink);
  background: var(--paper);
  font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", "Noto Sans JP", Meiryo, system-ui, sans-serif;
  line-height: 1.6;
}
main { max-width: 1080px; margin: 0 auto; padding: 0 20px 60px; }
h2 { border-bottom: 3px solid var(--accent); padding-bottom: 6px; margin-top: 48px; }

.wf-doc-header { background: var(--ink); color: #fff; padding: 28px 20px; }
.wf-doc-header h1 { margin: 0 auto; max-width: 1080px; font-size: 24px; }
.wf-doc-desc, .wf-doc-meta { max-width: 1080px; margin: 6px auto 0; opacity: .85; font-size: 13px; }
.wf-doc-footer { text-align: center; color: var(--muted); font-size: 12px; padding: 24px; }

/* 読み方・目次 */
.wf-legend { background: #fff; border: 1px solid var(--line); border-radius: 8px; padding: 10px 16px; margin-top: 24px; }
.wf-legend summary { cursor: pointer; font-weight: 700; }
.wf-legend li { margin: 6px 0; font-size: 14px; }
.wf-toc { display: flex; gap: 32px; flex-wrap: wrap; background: #fff; border: 1px solid var(--line); border-radius: 8px; padding: 12px 20px; margin-top: 16px; }
.wf-toc h4 { margin: 8px 0 4px; }
.wf-toc ol { margin: 0; padding-left: 20px; font-size: 14px; }
.wf-toc a { color: var(--ink); text-decoration: none; }
.wf-toc a:hover { color: var(--accent); }

/* フロー */
.wf-flow-section, .wf-screen-section { background: #fff; border: 1px solid var(--line); border-radius: 10px; padding: 16px 20px; margin: 20px 0; scroll-margin-top: 16px; }
.wf-flow-id, .wf-screen-id { display: inline-block; background: var(--accent); color: #fff; border-radius: 4px; font-size: 12px; padding: 1px 8px; margin-right: 8px; vertical-align: 2px; }
.wf-actor { float: right; font-size: 13px; font-weight: 400; color: var(--muted); }
.wf-flow-desc { color: var(--muted); font-size: 14px; margin-top: 0; }
.wf-strip { display: flex; align-items: flex-start; gap: 4px; overflow-x: auto; padding: 12px 4px 16px; }
.wf-flow-goal { align-self: center; white-space: nowrap; font-size: 13px; font-weight: 700; color: var(--good); padding: 0 8px; }

/* ミニチュア画面 */
.wf-thumb { position: relative; flex: 0 0 auto; width: 148px; text-align: center; text-decoration: none; color: var(--ink); }
.wf-thumb-no { position: absolute; top: -8px; left: -6px; z-index: 1; background: var(--ink); color: #fff; width: 22px; height: 22px; border-radius: 50%; font-size: 13px; line-height: 22px; display: inline-block; }
.wf-thumb-scale { display: block; height: 200px; overflow: hidden; border-radius: 8px; }
.wf-thumb-scale .wf-frame-wrap { transform: scale(.44); transform-origin: top left; width: 320px; pointer-events: none; }
.wf-thumb-scale::after { content: ""; position: absolute; left: 0; right: 0; top: 160px; height: 40px; background: linear-gradient(transparent, #fff); }
.wf-thumb-name { display: block; font-size: 12px; font-weight: 700; margin-top: 4px; }
.wf-thumb:hover .wf-thumb-name { color: var(--accent); }

/* ステップ間の矢印 */
.wf-arrow { flex: 0 0 auto; align-self: center; display: flex; flex-direction: column; justify-content: center; min-width: 110px; max-width: 160px; text-align: center; padding: 0 6px; }
.wf-arrow-action { font-size: 12px; font-weight: 700; color: var(--ink); }
.wf-arrow-line { display: block; position: relative; height: 2px; background: var(--ink); margin: 6px 2px; }
.wf-arrow-line::after { content: ""; position: absolute; right: -1px; top: -4px; border: 5px solid transparent; border-left-color: var(--ink); }
.wf-arrow-result { order: 3; font-size: 11px; color: var(--muted); }

/* Gherkin 表 */
.wf-gherkin { margin-top: 8px; font-size: 13px; }
.wf-gherkin summary { cursor: pointer; color: var(--muted); }
.wf-gherkin table { border-collapse: collapse; margin-top: 8px; width: 100%; }
.wf-gherkin th { width: 56px; text-align: center; font-size: 12px; color: #fff; border-radius: 4px; padding: 2px 6px; }
.wf-gherkin td { padding: 3px 10px; border-bottom: 1px dashed var(--line); }
.wf-gherkin-given th { background: #64748b; }
.wf-gherkin-when th { background: var(--accent); }
.wf-gherkin-then th { background: var(--good); }

/* 画面カタログ */
.wf-screen-note { color: var(--muted); font-size: 14px; margin-top: 0; }
.wf-screen-flows { font-size: 12px; }
.wf-tag { display: inline-block; background: #eef2ff; color: var(--accent); border-radius: 999px; padding: 1px 10px; text-decoration: none; margin: 2px; }
.wf-screen-section:target { outline: 3px solid var(--accent); animation: wf-flash 1.2s ease-out 1; }
@keyframes wf-flash { from { background: #dbeafe; } to { background: #fff; } }

/* ワイヤーフレーム本体（スマホ枠 320px） */
.wf-frame-wrap { display: inline-block; vertical-align: top; }
.wf-frame { width: 320px; min-height: 120px; border: 2px solid var(--ink); border-radius: 18px; background: #fff; padding: 14px 12px 8px; display: flex; flex-direction: column; gap: 8px; }
.wf-el { margin: 0; }
.wf-header { font-weight: 700; font-size: 16px; border-bottom: 2px solid var(--ink); padding-bottom: 6px; }
.wf-text { font-size: 13px; }
.wf-muted { color: var(--muted); font-size: 12px; }
.wf-input { display: block; font-size: 12px; }
.wf-input-label { display: block; color: var(--muted); margin-bottom: 2px; }
.wf-input-box { display: block; border: 1.5px solid var(--sketch); border-radius: 6px; padding: 7px 10px; color: var(--sketch); background: #fff; min-height: 34px; }
.wf-button { display: block; text-align: center; border-radius: 8px; padding: 9px 10px; font-size: 14px; font-weight: 700; text-decoration: none; }
.wf-button-primary { background: var(--ink); color: #fff; }
.wf-button-secondary { background: #fff; color: var(--ink); border: 1.5px solid var(--ink); }
.wf-button-danger { background: #fff; color: #b91c1c; border: 1.5px solid #b91c1c; }
.wf-link { display: block; text-align: center; color: var(--accent); text-decoration: underline; font-size: 13px; }
.wf-hotspot { outline: 2px dashed var(--accent); outline-offset: 2px; cursor: pointer; }
.wf-hotspot:hover { outline-style: solid; }
.wf-list-label, .wf-choice-label, .wf-chart-label { font-size: 12px; color: var(--muted); margin-bottom: 4px; }
.wf-list ul { margin: 0; padding: 0; list-style: none; border: 1.5px solid var(--line); border-radius: 8px; }
.wf-list li { padding: 7px 10px; font-size: 13px; border-bottom: 1px solid var(--line); }
.wf-list li:last-child { border-bottom: none; }
.wf-card { border: 1.5px solid var(--line); border-radius: 10px; padding: 10px 12px; background: #fff; }
.wf-card-label { font-size: 12px; color: var(--muted); }
.wf-card-value { font-size: 22px; font-weight: 700; }
.wf-card-caption { font-size: 11px; color: var(--muted); }
.wf-chart { border: 1.5px solid var(--line); border-radius: 10px; padding: 10px 12px; color: var(--sketch); }
.wf-chart-bars { display: flex; align-items: flex-end; gap: 6px; height: 64px; }
.wf-chart-bars span { flex: 1; background: repeating-linear-gradient(45deg, #e5e7eb, #e5e7eb 4px, #f3f4f6 4px, #f3f4f6 8px); border: 1px solid var(--sketch); border-radius: 3px 3px 0 0; }
.wf-chart-donut { width: 64px; height: 64px; margin: 0 auto; border-radius: 50%; background: conic-gradient(var(--sketch) 0 40%, #e5e7eb 40% 75%, #f3f4f6 75%); -webkit-mask: radial-gradient(circle 18px, transparent 98%, #000); mask: radial-gradient(circle 18px, transparent 98%, #000); }
.wf-chart-line { width: 100%; height: 64px; }
.wf-image { border: 1.5px dashed var(--sketch); border-radius: 8px; min-height: 64px; display: flex; align-items: center; justify-content: center; gap: 6px; color: var(--sketch); font-size: 12px; }
.wf-image svg { width: 28px; height: 28px; }
.wf-badge { display: inline-block; align-self: flex-start; border-radius: 999px; font-size: 11px; font-weight: 700; padding: 2px 10px; }
.wf-badge-good { background: #ecfdf5; color: var(--good); border: 1px solid var(--good); }
.wf-badge-caution { background: #fffbeb; color: var(--caution); border: 1px solid var(--caution); }
.wf-badge-neutral { background: #f3f4f6; color: var(--muted); border: 1px solid var(--line); }
.wf-choice-items { display: flex; border: 1.5px solid var(--ink); border-radius: 8px; overflow: hidden; }
.wf-choice-item { flex: 1; text-align: center; font-size: 12px; padding: 6px 4px; border-right: 1px solid var(--line); }
.wf-choice-item:last-child { border-right: none; }
.wf-choice-item.wf-selected, .wf-nav-item.wf-selected { background: var(--ink); color: #fff; font-weight: 700; }
.wf-nav { display: flex; border-top: 2px solid var(--ink); margin: auto -12px -8px; padding-top: 0; }
.wf-nav-item { flex: 1; text-align: center; font-size: 11px; padding: 8px 2px; }
.wf-divider { border: none; border-top: 1.5px dashed var(--line); width: 100%; }
.wf-note-mark { color: var(--accent); font-weight: 700; margin-left: 2px; }
.wf-notes { max-width: 320px; font-size: 12px; color: var(--muted); padding-left: 20px; margin: 8px 0 0; }
.wf-notes li { list-style: none; counter-increment: wf-note; position: relative; }
.wf-notes li::before { content: counter(wf-note); position: absolute; left: -18px; top: 2px; width: 14px; height: 14px; border: 1px solid var(--accent); border-radius: 50%; color: var(--accent); font-size: 10px; line-height: 14px; text-align: center; }

@media print {
  body { background: #fff; }
  .wf-doc-header { background: #fff; color: var(--ink); border-bottom: 3px solid var(--ink); }
  .wf-legend, .wf-toc { display: none; }
  .wf-flow-section, .wf-screen-section { break-inside: avoid; border: none; padding: 0; }
  .wf-strip { overflow: visible; flex-wrap: wrap; }
}
`;
}
