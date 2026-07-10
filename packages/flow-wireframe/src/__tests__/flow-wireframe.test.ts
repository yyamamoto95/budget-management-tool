import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { renderHtml, escapeHtml } from "../render";
import { validate } from "../validate";
import type { FlowDefinition } from "../types";

const minimalDef = (): FlowDefinition => ({
  title: "テストフロー",
  screens: [
    {
      id: "a",
      name: "画面A",
      elements: [
        { type: "header", label: "A" },
        { type: "button", label: "進む", goto: "b" },
      ],
    },
    {
      id: "b",
      name: "画面B",
      elements: [{ type: "text", label: "<b>エスケープ確認</b>", note: "注釈1" }],
    },
  ],
  flows: [
    {
      id: "F-1",
      name: "AからBへ",
      scenario: { given: ["Aにいる"], when: ["進むを押す"], then: ["Bに遷移する"] },
      steps: [
        { screen: "a", action: "進むを押す" },
        { screen: "b", result: "完了" },
      ],
    },
  ],
});

describe("validate", () => {
  it("正しい定義を受理する", () => {
    expect(validate(minimalDef())).toEqual({ ok: true, errors: [] });
  });

  it("存在しない画面への遷移(goto)を検出する", () => {
    const def = minimalDef();
    def.screens[0].elements.push({ type: "link", label: "迷子", goto: "nowhere" });
    const result = validate(def);
    expect(result.ok).toBe(false);
    expect(result.errors.join()).toContain("nowhere");
  });

  it("フローの手順が参照する画面の不在を検出する", () => {
    const def = minimalDef();
    def.flows[0].steps.push({ screen: "ghost" });
    const result = validate(def);
    expect(result.ok).toBe(false);
    expect(result.errors.join()).toContain("ghost");
  });

  it("画面IDの重複を検出する", () => {
    const def = minimalDef();
    def.screens.push({ ...def.screens[0] });
    expect(validate(def).errors.join()).toContain("重複");
  });

  it("最後以外の手順で action の欠落を検出する", () => {
    const def = minimalDef();
    delete def.flows[0].steps[0].action;
    expect(validate(def).errors.join()).toContain("action");
  });
});

describe("renderHtml", () => {
  it("自己完結型のHTML(外部参照なし)を生成する", () => {
    const html = renderHtml(minimalDef());
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("テストフロー");
    expect(html).not.toMatch(/src=["']https?:/);
    expect(html).not.toMatch(/href=["']https?:/);
    expect(html).not.toContain("<script");
  });

  it("画面・フロー・Gherkinシナリオを含む", () => {
    const html = renderHtml(minimalDef());
    expect(html).toContain('id="screen-a"');
    expect(html).toContain('id="screen-b"');
    expect(html).toContain('id="flow-F-1"');
    expect(html).toContain("Bに遷移する");
  });

  it("goto をアンカーリンクとして描画する", () => {
    const html = renderHtml(minimalDef());
    expect(html).toContain('href="#screen-b"');
  });

  it("ユーザー入力をエスケープする", () => {
    const html = renderHtml(minimalDef());
    expect(html).not.toContain("<b>エスケープ確認</b>");
    expect(html).toContain("&lt;b&gt;エスケープ確認&lt;/b&gt;");
  });

  it("同じ定義から常に同じHTMLを生成する（再現性）", () => {
    expect(renderHtml(minimalDef())).toBe(renderHtml(minimalDef()));
  });

  it("ミニチュア内にアンカーを入れ子にしない（<a>の入れ子はHTMLとして不正）", () => {
    const html = renderHtml(minimalDef());
    for (const thumb of html.match(/<a class="wf-thumb"[\s\S]*?<\/a>/g) ?? []) {
      expect(thumb.match(/<a /g)?.length).toBe(1);
    }
    // ミニチュアは1手順につき1つだけ生成される
    expect(html.match(/class="wf-thumb"/g)?.length).toBe(2);
  });

  it("不正な定義では全エラーを列挙して例外を投げる", () => {
    const def = minimalDef();
    def.flows[0].steps.push({ screen: "ghost" });
    expect(() => renderHtml(def)).toThrow(/ghost/);
  });
});

describe("v0.2 の汎用化機能", () => {
  it("layout: desktop はブラウザ枠として描画される", () => {
    const def = minimalDef();
    def.screens[0].layout = "desktop";
    const html = renderHtml(def);
    expect(html).toContain("wf-desktop");
    expect(html).toContain("wf-browser-bar");
  });

  it("process ステップは画面なしの処理ノードとして描画される", () => {
    const def = minimalDef();
    def.flows[0].steps = [
      { screen: "a", action: "保存する" },
      { process: "ダイジェストを生成", actor: "システム", action: "配信する" },
      { screen: "b", result: "完了" },
    ];
    const html = renderHtml(def);
    expect(html).toContain("wf-process");
    expect(html).toContain("ダイジェストを生成");
    expect(html).toContain("システム");
  });

  it("screen と process の同時指定・両方欠落を検出する", () => {
    const def = minimalDef();
    def.flows[0].steps = [
      { screen: "a", process: "二重指定", action: "x" },
      { action: "y" },
      { screen: "b" },
    ];
    const errors = validate(def).errors.join();
    expect(errors).toContain("どちらか一方");
    expect(errors).toContain("どちらかを指定");
  });

  it("nav 項目の goto はホットスポットになり、参照切れは検出される", () => {
    const def = minimalDef();
    def.screens[0].elements.push({
      type: "nav",
      items: [{ label: "B画面へ", goto: "b" }, "設定"],
      selected: "設定",
    });
    const html = renderHtml(def);
    expect(html).toContain("wf-nav-hotspot");

    def.screens[0].elements.push({ type: "nav", items: [{ label: "迷子", goto: "nowhere" }] });
    expect(validate(def).errors.join()).toContain("nowhere");
  });

  it("external な部品は ↗ マーク付きで描画される", () => {
    const def = minimalDef();
    def.screens[0].elements.push({ type: "link", label: "記事を読む", external: true });
    const html = renderHtml(def);
    expect(html).toContain("wf-external");
  });
});

describe("JSON Schema", () => {
  it("schema が有効な JSON で、TypeScript の element type 一覧と一致する", () => {
    const schema = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "..", "..", "schema", "flow-wireframe.schema.json"),
        "utf-8"
      )
    );
    const schemaTypes: string[] = schema.definitions.element.properties.type.enum;
    // render.ts の switch が扱う全部品タイプ（types.ts の ScreenElement と対応）
    const implemented = [
      "header", "text", "input", "button", "link", "list", "card",
      "chart", "image", "badge", "choice", "nav", "divider",
    ];
    expect([...schemaTypes].sort()).toEqual([...implemented].sort());
  });
});

describe("escapeHtml", () => {
  it("HTML特殊文字をすべて変換する", () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;"
    );
  });
});

describe("examples/kakeibo.flow.json", () => {
  it("サンプル定義がスキーマとして妥当でレンダリングできる", () => {
    const raw = fs.readFileSync(
      path.join(__dirname, "..", "..", "examples", "kakeibo.flow.json"),
      "utf-8"
    );
    const def = JSON.parse(raw) as FlowDefinition;
    expect(validate(def).errors).toEqual([]);
    const html = renderHtml(def);
    expect(html).toContain("US-301");
    expect(html).toContain("生活余力");
  });
});
