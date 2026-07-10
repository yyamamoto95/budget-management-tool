import type { FlowDefinition } from "./types";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * フロー定義の整合性を検証する。
 * 参照切れ（存在しない画面 ID への遷移など）は生成前にすべて検出し、
 * 非エンジニアにも原因が分かる日本語メッセージで返す。
 */
export function validate(def: FlowDefinition): ValidationResult {
  const errors: string[] = [];

  if (!def.title || typeof def.title !== "string") {
    errors.push("title（ドキュメント名）を文字列で指定してください");
  }
  if (!Array.isArray(def.screens) || def.screens.length === 0) {
    errors.push("screens（画面）を1つ以上定義してください");
  }
  if (!Array.isArray(def.flows) || def.flows.length === 0) {
    errors.push("flows（業務フロー）を1つ以上定義してください");
  }
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const screenIds = new Set<string>();
  for (const screen of def.screens) {
    if (!screen.id) {
      errors.push(`画面「${screen.name ?? "(名称未設定)"}」に id がありません`);
      continue;
    }
    if (screenIds.has(screen.id)) {
      errors.push(`画面 ID「${screen.id}」が重複しています`);
    }
    screenIds.add(screen.id);
    if (!screen.name) {
      errors.push(`画面「${screen.id}」に name（画面名）がありません`);
    }
    for (const el of screen.elements ?? []) {
      if ("goto" in el && el.goto && !def.screens.some((s) => s.id === el.goto)) {
        errors.push(
          `画面「${screen.id}」の部品「${el.label}」の遷移先 goto「${el.goto}」が screens に存在しません`
        );
      }
    }
  }

  const flowIds = new Set<string>();
  for (const flow of def.flows) {
    if (!flow.id) {
      errors.push(`フロー「${flow.name ?? "(名称未設定)"}」に id がありません`);
      continue;
    }
    if (flowIds.has(flow.id)) {
      errors.push(`フロー ID「${flow.id}」が重複しています`);
    }
    flowIds.add(flow.id);
    if (!Array.isArray(flow.steps) || flow.steps.length === 0) {
      errors.push(`フロー「${flow.id}」に steps（手順）がありません`);
      continue;
    }
    flow.steps.forEach((step, i) => {
      if (!screenIds.has(step.screen)) {
        errors.push(
          `フロー「${flow.id}」の手順${i + 1}が参照する画面「${step.screen}」が screens に存在しません`
        );
      }
      if (i < flow.steps.length - 1 && !step.action) {
        errors.push(
          `フロー「${flow.id}」の手順${i + 1}（画面「${step.screen}」）に action（操作）がありません。最後の手順以外は操作を書いてください`
        );
      }
    });
  }

  return { ok: errors.length === 0, errors };
}
