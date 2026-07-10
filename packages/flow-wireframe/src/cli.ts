#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import { renderHtml } from "./render";
import { validate } from "./validate";
import type { FlowDefinition } from "./types";

const HELP = `flow-wireframe — 業務フロー定義(JSON)から静的HTMLワイヤーフレームを生成します

使い方:
  flow-wireframe build <定義.json> [-o 出力.html]   HTML を生成する
  flow-wireframe check <定義.json>                  定義の整合性だけを検証する
  flow-wireframe init  <定義.json>                  ひな形の定義ファイルを作る

例:
  flow-wireframe init flow.json
  flow-wireframe build flow.json -o wireframe.html
`;

const STARTER: FlowDefinition = {
  $schema:
    "https://unpkg.com/@yyamamoto95/flow-wireframe/schema/flow-wireframe.schema.json",
  title: "サンプル業務フロー",
  description: "このファイルを書き換えて、自分のサービスの画面とフローを定義してください。",
  version: "0.1.0",
  screens: [
    {
      id: "home",
      name: "ホーム画面",
      note: "最初に表示される画面",
      elements: [
        { type: "header", label: "ホーム" },
        { type: "text", label: "ようこそ！" },
        { type: "button", label: "はじめる", goto: "next" },
      ],
    },
    {
      id: "next",
      name: "次の画面",
      elements: [
        { type: "header", label: "次の画面" },
        { type: "text", label: "ここに要素を追加していきます。" },
        { type: "link", label: "ホームに戻る", goto: "home" },
      ],
    },
  ],
  flows: [
    {
      id: "FLOW-001",
      name: "はじめての操作",
      actor: "利用者",
      scenario: {
        given: ["利用者がホーム画面にいる"],
        when: ["「はじめる」を押す"],
        then: ["次の画面に遷移する"],
      },
      steps: [
        { screen: "home", action: "「はじめる」を押す" },
        { screen: "next", result: "完了" },
      ],
    },
  ],
};

function readDefinition(file: string): FlowDefinition {
  if (!fs.existsSync(file)) {
    fail(`定義ファイルが見つかりません: ${file}`);
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as FlowDefinition;
  } catch (e) {
    fail(`JSON の読み込みに失敗しました: ${(e as Error).message}`);
  }
}

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

export function main(argv: string[] = process.argv.slice(2)): void {
  const [command, file, ...rest] = argv;

  if (!command || command === "--help" || command === "-h") {
    console.log(HELP);
    return;
  }
  if (!file) {
    fail(`ファイルを指定してください。\n\n${HELP}`);
  }

  switch (command) {
    case "init": {
      if (fs.existsSync(file)) {
        fail(`${file} は既に存在します。上書きを避けるため中断しました`);
      }
      fs.writeFileSync(file, JSON.stringify(STARTER, null, 2) + "\n", "utf-8");
      console.log(`✔ ひな形を作成しました: ${file}`);
      return;
    }
    case "check": {
      const result = validate(readDefinition(file));
      if (!result.ok) {
        fail(`定義にエラーがあります:\n- ${result.errors.join("\n- ")}`);
      }
      console.log("✔ 定義に問題はありません");
      return;
    }
    case "build": {
      const def = readDefinition(file);
      const outIndex = rest.findIndex((a) => a === "-o" || a === "--out");
      const out =
        outIndex >= 0 && rest[outIndex + 1]
          ? rest[outIndex + 1]
          : file.replace(/\.json$/i, "") + ".html";
      let html: string;
      try {
        html = renderHtml(def);
      } catch (e) {
        fail((e as Error).message);
      }
      fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
      fs.writeFileSync(out, html, "utf-8");
      console.log(
        `✔ 生成しました: ${out}（画面 ${def.screens.length} / フロー ${def.flows.length}）`
      );
      return;
    }
    default:
      fail(`不明なコマンドです: ${command}\n\n${HELP}`);
  }
}

if (require.main === module) {
  main();
}
