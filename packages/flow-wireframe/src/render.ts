import type {
  Flow,
  FlowDefinition,
  RenderOptions,
  Screen,
  ScreenElement,
} from "./types";
import { validate } from "./validate";
import { buildCss } from "./theme";

const CIRCLED = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const esc = escapeHtml;

/** goto 付き部品をアンカーとして描く際の共通属性 */
function gotoAttrs(goto: string | undefined): string {
  return goto ? ` href="#screen-${esc(goto)}" title="クリックで「${esc(goto)}」へ移動"` : "";
}

interface NoteCollector {
  notes: string[];
  mark(note: string | undefined): string;
}

function createNoteCollector(): NoteCollector {
  const notes: string[] = [];
  return {
    notes,
    mark(note) {
      if (!note) return "";
      notes.push(note);
      const n = notes.length - 1;
      const mark = n < CIRCLED.length ? CIRCLED[n] : `(${n + 1})`;
      return `<sup class="wf-note-mark">${mark}</sup>`;
    },
  };
}

function renderElement(el: ScreenElement, c: NoteCollector, interactive: boolean): string {
  const mark = c.mark(el.note);
  switch (el.type) {
    case "header":
      return `<div class="wf-el wf-header">${esc(el.label)}${mark}</div>`;
    case "text":
      return `<p class="wf-el wf-text${el.muted ? " wf-muted" : ""}">${esc(el.label)}${mark}</p>`;
    case "input":
      return (
        `<label class="wf-el wf-input"><span class="wf-input-label">${esc(el.label)}${mark}</span>` +
        `<span class="wf-input-box${el.secret ? " wf-secret" : ""}">${
          el.secret ? "●●●●●●" : esc(el.placeholder ?? "")
        }</span></label>`
      );
    case "button": {
      const variant = el.variant ?? "primary";
      const hot = interactive && el.goto;
      const tag = hot ? "a" : "span";
      return `<${tag} class="wf-el wf-button wf-button-${variant}${hot ? " wf-hotspot" : ""}"${hot ? gotoAttrs(el.goto) : ""}>${esc(el.label)}${mark}</${tag}>`;
    }
    case "link": {
      const hot = interactive && el.goto;
      const tag = hot ? "a" : "span";
      return `<${tag} class="wf-el wf-link${hot ? " wf-hotspot" : ""}"${hot ? gotoAttrs(el.goto) : ""}>${esc(el.label)}${mark}</${tag}>`;
    }
    case "list": {
      const label = el.label ? `<div class="wf-list-label">${esc(el.label)}${mark}</div>` : mark;
      const items = el.items.map((i) => `<li>${esc(i)}</li>`).join("");
      return `<div class="wf-el wf-list">${label}<ul>${items}</ul></div>`;
    }
    case "card":
      return (
        `<div class="wf-el wf-card"><div class="wf-card-label">${esc(el.label)}${mark}</div>` +
        (el.value ? `<div class="wf-card-value">${esc(el.value)}</div>` : "") +
        (el.caption ? `<div class="wf-card-caption">${esc(el.caption)}</div>` : "") +
        `</div>`
      );
    case "chart": {
      const kind = el.kind ?? "bar";
      const label = el.label ? `<div class="wf-chart-label">${esc(el.label)}${mark}</div>` : mark;
      let body = "";
      if (kind === "bar") {
        body =
          `<div class="wf-chart-bars">` +
          [60, 90, 45, 75, 30]
            .map((h) => `<span style="height:${h}%"></span>`)
            .join("") +
          `</div>`;
      } else if (kind === "donut") {
        body = `<div class="wf-chart-donut"></div>`;
      } else {
        body =
          `<svg class="wf-chart-line" viewBox="0 0 100 40" preserveAspectRatio="none">` +
          `<polyline points="0,32 20,24 40,28 60,14 80,18 100,6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
      }
      return `<div class="wf-el wf-chart">${label}${body}</div>`;
    }
    case "image":
      return (
        `<div class="wf-el wf-image"><svg viewBox="0 0 24 24" aria-hidden="true">` +
        `<path d="M3 5h18v14H3z M3 15l5-5 4 4 3-3 6 6" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>` +
        (el.label ? `<span>${esc(el.label)}${mark}</span>` : mark) +
        `</div>`
      );
    case "badge":
      return `<span class="wf-el wf-badge wf-badge-${el.tone ?? "neutral"}">${esc(el.label)}${mark}</span>`;
    case "choice": {
      const label = el.label ? `<div class="wf-choice-label">${esc(el.label)}${mark}</div>` : mark;
      const items = el.items
        .map(
          (i) =>
            `<span class="wf-choice-item${i === el.selected ? " wf-selected" : ""}">${esc(i)}</span>`
        )
        .join("");
      return `<div class="wf-el wf-choice">${label}<div class="wf-choice-items">${items}</div></div>`;
    }
    case "nav": {
      const items = el.items
        .map(
          (i) =>
            `<span class="wf-nav-item${i === el.selected ? " wf-selected" : ""}">${esc(i)}</span>`
        )
        .join("");
      return `<div class="wf-el wf-nav">${items}${mark}</div>`;
    }
    case "divider":
      return `<hr class="wf-el wf-divider" />`;
  }
}

/**
 * 1画面のワイヤーフレーム（スマホ枠）を描く。
 * interactive=false はミニチュア用: <a> の入れ子（HTML では不正）を避けるため
 * ホットスポットを描かず、注釈リストも省略する。
 */
function renderScreenFrame(screen: Screen, interactive = true): string {
  const c = interactive ? createNoteCollector() : { notes: [], mark: () => "" };
  const body = screen.elements.map((el) => renderElement(el, c, interactive)).join("\n");
  const notes =
    interactive && c.notes.length > 0
      ? `<ol class="wf-notes">${c.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ol>`
      : "";
  return (
    `<div class="wf-frame-wrap">` +
    `<div class="wf-frame">${body}</div>` +
    notes +
    `</div>`
  );
}

/** 画面カタログの 1 セクション */
function renderScreenSection(screen: Screen, usedBy: Flow[]): string {
  const flows = usedBy
    .map((f) => `<a class="wf-tag" href="#flow-${esc(f.id)}">${esc(f.id)} ${esc(f.name)}</a>`)
    .join(" ");
  return (
    `<section class="wf-screen-section" id="screen-${esc(screen.id)}">` +
    `<h3><span class="wf-screen-id">${esc(screen.id)}</span>${esc(screen.name)}</h3>` +
    (screen.note ? `<p class="wf-screen-note">${esc(screen.note)}</p>` : "") +
    (flows ? `<p class="wf-screen-flows">登場するフロー: ${flows}</p>` : "") +
    renderScreenFrame(screen) +
    `</section>`
  );
}

/** フロー内で使うミニチュア画面（実物のワイヤーフレームを縮小表示） */
function renderThumb(screen: Screen, stepNo: number): string {
  return (
    `<a class="wf-thumb" href="#screen-${esc(screen.id)}" title="クリックで画面の詳細へ">` +
    `<span class="wf-thumb-no">${stepNo}</span>` +
    `<span class="wf-thumb-scale">${renderScreenFrame(screen, false)}</span>` +
    `<span class="wf-thumb-name">${esc(screen.name)}</span>` +
    `</a>`
  );
}

function renderScenario(flow: Flow): string {
  if (!flow.scenario) return "";
  const row = (kind: string, jp: string, lines: string[]) =>
    lines
      .map(
        (line, i) =>
          `<tr class="wf-gherkin-${kind}"><th>${i === 0 ? jp : "かつ"}</th><td>${esc(line)}</td></tr>`
      )
      .join("");
  return (
    `<details class="wf-gherkin" open><summary>ふるまい（Given / When / Then）</summary><table>` +
    row("given", "前提", flow.scenario.given) +
    row("when", "操作", flow.scenario.when) +
    row("then", "結果", flow.scenario.then) +
    `</table></details>`
  );
}

function renderFlowSection(flow: Flow, screensById: Map<string, Screen>): string {
  const strip = flow.steps
    .map((step, i) => {
      const screen = screensById.get(step.screen);
      const thumb = screen ? renderThumb(screen, i + 1) : "";
      const isLast = i === flow.steps.length - 1;
      const arrow = !isLast
        ? `<span class="wf-arrow"><span class="wf-arrow-action">${esc(step.action ?? "")}</span>` +
          (step.result ? `<span class="wf-arrow-result">${esc(step.result)}</span>` : "") +
          `<span class="wf-arrow-line" aria-hidden="true"></span></span>`
        : step.result
          ? `<span class="wf-flow-goal">🏁 ${esc(step.result)}</span>`
          : "";
      return thumb + arrow;
    })
    .join("");
  return (
    `<section class="wf-flow-section" id="flow-${esc(flow.id)}">` +
    `<h3><span class="wf-flow-id">${esc(flow.id)}</span>${esc(flow.name)}` +
    (flow.actor ? `<span class="wf-actor">👤 ${esc(flow.actor)}</span>` : "") +
    `</h3>` +
    (flow.description ? `<p class="wf-flow-desc">${esc(flow.description)}</p>` : "") +
    `<div class="wf-strip">${strip}</div>` +
    renderScenario(flow) +
    `</section>`
  );
}

function renderLegend(): string {
  return (
    `<details class="wf-legend"><summary>この資料の読み方</summary><ul>` +
    `<li><strong>業務フロー</strong>: 画面の縮小図と矢印で「誰が・どの画面で・何をすると・どうなるか」を表します。矢印の上が<strong>操作</strong>、下が<strong>システムの応答</strong>です。</li>` +
    `<li><strong>ふるまい表</strong>: 各フローの下にある「前提・操作・結果」の表は、開発で使うテストシナリオ（Gherkin）と1対1で対応します。</li>` +
    `<li><strong>画面カタログ</strong>: フロー中の縮小図をクリックすると、その画面の実寸ワイヤーフレームへ移動します。</li>` +
    `<li><strong>青い枠のボタン・リンク</strong>はクリックできるホットスポットです。クリックすると遷移先の画面へ移動し、移動先が一瞬ハイライトされます。</li>` +
    `<li>①②… の印は画面下の注釈と対応します。</li>` +
    `</ul></details>`
  );
}

function renderToc(def: FlowDefinition): string {
  const flowItems = def.flows
    .map(
      (f) =>
        `<li><a href="#flow-${esc(f.id)}"><span class="wf-flow-id">${esc(f.id)}</span>${esc(f.name)}</a></li>`
    )
    .join("");
  const screenItems = def.screens
    .map((s) => `<li><a href="#screen-${esc(s.id)}">${esc(s.name)}</a></li>`)
    .join("");
  return (
    `<nav class="wf-toc"><div><h4>業務フロー</h4><ol>${flowItems}</ol></div>` +
    `<div><h4>画面カタログ</h4><ol>${screenItems}</ol></div></nav>`
  );
}

/**
 * フロー定義から自己完結型の静的 HTML（1ファイル・JS なし）を生成する。
 * 定義が不正な場合は、全エラーをまとめた Error を投げる。
 */
export function renderHtml(def: FlowDefinition, options: RenderOptions = {}): string {
  const result = validate(def);
  if (!result.ok) {
    throw new Error(`フロー定義にエラーがあります:\n- ${result.errors.join("\n- ")}`);
  }

  const screensById = new Map(def.screens.map((s) => [s.id, s]));
  const flowsByScreen = (screenId: string) =>
    def.flows.filter((f) => f.steps.some((st) => st.screen === screenId));

  const flowSections = def.flows.map((f) => renderFlowSection(f, screensById)).join("\n");
  const screenSections = def.screens
    .map((s) => renderScreenSection(s, flowsByScreen(s.id)))
    .join("\n");

  const meta = [
    def.version ? `版: ${esc(def.version)}` : "",
    options.generatedAt ? `生成: ${esc(options.generatedAt)}` : "",
  ]
    .filter(Boolean)
    .join(" ／ ");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(def.title)}</title>
<style>${buildCss(def.accent)}</style>
</head>
<body>
<header class="wf-doc-header">
<h1>${esc(def.title)}</h1>
${def.description ? `<p class="wf-doc-desc">${esc(def.description)}</p>` : ""}
${meta ? `<p class="wf-doc-meta">${meta}</p>` : ""}
</header>
<main>
${renderLegend()}
${renderToc(def)}
<h2 id="flows">業務フロー</h2>
${flowSections}
<h2 id="screens">画面カタログ</h2>
${screenSections}
</main>
<footer class="wf-doc-footer">Generated by @yyamamoto95/flow-wireframe — 定義(JSON)と出力(HTML)は1対1で対応します</footer>
</body>
</html>
`;
}
