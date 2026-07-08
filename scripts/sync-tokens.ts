/**
 * Figmaデザイントークン同期スクリプト
 *
 * Figma Variables APIエクスポートJSON（またはローカルJSONファイル）から
 * CSS変数ブロックを生成し、apps/web/src/app/globals.css の @generated セクションを更新する。
 *
 * 使い方:
 *   # ローカルJSONから同期
 *   ts-node --project tsconfig.scripts.json scripts/sync-tokens.ts --input .github/design/figma-tokens.json
 *
 *   # Figma API から直接取得（FIGMA_TOKEN, FIGMA_FILE_ID 環境変数が必要）
 *   ts-node --project tsconfig.scripts.json scripts/sync-tokens.ts --figma
 *
 * Figmaエクスポート形式（.github/design/figma-tokens.json）:
 * {
 *   "colors": {
 *     "brand/primary": { "value": "#2563eb", "type": "color" },
 *     "surface/default": { "value": "#ffffff", "type": "color" }
 *   },
 *   "spacing": {
 *     "sm": { "value": "8", "type": "dimension", "unit": "px" },
 *     "md": { "value": "16", "type": "dimension", "unit": "px" }
 *   },
 *   "borderRadius": {
 *     "card": { "value": "12", "type": "dimension", "unit": "px" },
 *     "full": { "value": "9999", "type": "dimension", "unit": "px" }
 *   }
 * }
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ── 型定義 ──────────────────────────────────────────────────────

type TokenType = 'color' | 'dimension';

interface ColorToken {
    value: string;
    type: 'color';
}

interface DimensionToken {
    value: string;
    type: 'dimension';
    unit?: 'px' | 'rem';
}

type Token = ColorToken | DimensionToken;

interface FigmaTokenSet {
    colors?: Record<string, ColorToken>;
    spacing?: Record<string, DimensionToken>;
    borderRadius?: Record<string, DimensionToken>;
}

// ── パス定義 ────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const GLOBALS_CSS_PATH = path.join(ROOT, 'apps/web/src/app/globals.css');
const DEFAULT_TOKENS_PATH = path.join(ROOT, '.github/design/figma-tokens.json');
const GENERATED_MARKER_START = '/* @generated:start by scripts/sync-tokens.ts */';
const GENERATED_MARKER_END = '/* @generated:end */';

// ── トークン名変換 ───────────────────────────────────────────────

/** "brand/primary" → "--color-brand-primary" */
function toColorVarName(key: string): string {
    return `--color-${key.replace(/\//g, '-')}`;
}

/** "sm" → "--spacing-sm" */
function toSpacingVarName(key: string): string {
    return `--spacing-${key}`;
}

/** "card" → "--radius-card" */
function toRadiusVarName(key: string): string {
    return `--radius-${key}`;
}

/** 数値＋単位に整形 */
function formatDimension(token: DimensionToken): string {
    const unit = token.unit ?? 'px';
    return `${token.value}${unit}`;
}

// ── CSS変数ブロック生成 ──────────────────────────────────────────

function generateCssBlock(tokens: FigmaTokenSet): string {
    const lines: string[] = [
        GENERATED_MARKER_START,
        ':root {',
    ];

    if (tokens.colors && Object.keys(tokens.colors).length > 0) {
        lines.push('  /* カラートークン */');
        for (const [key, token] of Object.entries(tokens.colors)) {
            lines.push(`  ${toColorVarName(key)}: ${token.value};`);
        }
    }

    if (tokens.spacing && Object.keys(tokens.spacing).length > 0) {
        lines.push('  /* スペーシングトークン */');
        for (const [key, token] of Object.entries(tokens.spacing)) {
            lines.push(`  ${toSpacingVarName(key)}: ${formatDimension(token)};`);
        }
    }

    if (tokens.borderRadius && Object.keys(tokens.borderRadius).length > 0) {
        lines.push('  /* ボーダー半径トークン */');
        for (const [key, token] of Object.entries(tokens.borderRadius)) {
            lines.push(`  ${toRadiusVarName(key)}: ${formatDimension(token)};`);
        }
    }

    lines.push('}');
    lines.push(GENERATED_MARKER_END);

    return lines.join('\n');
}

// ── globals.css への書き込み ─────────────────────────────────────

function updateGlobalsCss(tokens: FigmaTokenSet): void {
    let cssContent = fs.readFileSync(GLOBALS_CSS_PATH, 'utf-8');
    const newBlock = generateCssBlock(tokens);

    const startIdx = cssContent.indexOf(GENERATED_MARKER_START);
    const endIdx = cssContent.indexOf(GENERATED_MARKER_END);

    if (startIdx !== -1 && endIdx !== -1) {
        // 既存の @generated ブロックを置換
        cssContent = cssContent.slice(0, startIdx) + newBlock + cssContent.slice(endIdx + GENERATED_MARKER_END.length);
    } else {
        // 末尾に追記（初回実行時）
        cssContent = cssContent.trimEnd() + '\n\n' + newBlock + '\n';
    }

    fs.writeFileSync(GLOBALS_CSS_PATH, cssContent, 'utf-8');
    console.log(`✅ デザイントークンを更新しました: ${GLOBALS_CSS_PATH}`);
}

// ── モバイル用トークン生成 ────────────────────────────────────────

const MOBILE_TOKENS_PATH = path.join(ROOT, 'apps/mobile/src/theme/tokens.generated.ts');

/**
 * ライトモードの実値以外の at-rule ブロックを波括弧の対応を数えて取り除く。
 * 対象: @media（ダークモード）/ @theme（Tailwind v4 の自己参照マッピング）/ @layer
 */
function stripAtRuleBlocks(css: string): string {
    const atRules = ['@media', '@theme', '@layer'];
    let result = '';
    let i = 0;
    while (i < css.length) {
        const indices = atRules
            .map((rule) => css.indexOf(rule, i))
            .filter((idx) => idx !== -1);
        if (indices.length === 0) {
            result += css.slice(i);
            break;
        }
        const atIdx = Math.min(...indices);
        result += css.slice(i, atIdx);
        // ブロック開始の { を探し、対応する } まで読み飛ばす
        let j = css.indexOf('{', atIdx);
        if (j === -1) break;
        let depth = 1;
        j += 1;
        while (j < css.length && depth > 0) {
            if (css[j] === '{') depth += 1;
            if (css[j] === '}') depth -= 1;
            j += 1;
        }
        i = j;
    }
    return result;
}

/** ライトモードの CSS 変数一覧を抽出する（後勝ち・var() は一段解決） */
function extractLightCssVars(css: string): Record<string, string> {
    const light = stripAtRuleBlocks(css);
    const vars: Record<string, string> = {};
    const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(light)) !== null) {
        vars[m[1]] = m[2].trim();
    }
    // var(--x) 参照を一段だけ解決する（RN では CSS 変数参照が使えないため）
    for (const [key, value] of Object.entries(vars)) {
        vars[key] = value.replace(/var\((--[\w-]+)\)/g, (_, name: string) => vars[name] ?? `var(${name})`);
    }
    return vars;
}

/**
 * apps/mobile/src/theme/tokens.generated.ts を生成する。
 * keyof 型で参照するため、変数が消えるとモバイルの type-check が失敗する（乖離の検知）。
 */
function updateMobileTokens(): void {
    const cssContent = fs.readFileSync(GLOBALS_CSS_PATH, 'utf-8');
    const vars = extractLightCssVars(cssContent);

    const entries = Object.entries(vars)
        .map(([name, value]) => `  '${name}': ${JSON.stringify(value)},`)
        .join('\n');

    const content = [
        '// @generated by scripts/sync-tokens.ts — 手動編集禁止（pnpm sync:tokens で再生成）',
        '// SSOT: .github/design/figma-tokens.json + apps/web/src/app/globals.css（ライトモード :root）',
        'export const cssVars = {',
        entries,
        '} as const;',
        '',
        'export type CssVarName = keyof typeof cssVars;',
        '',
    ].join('\n');

    fs.writeFileSync(MOBILE_TOKENS_PATH, content, 'utf-8');
    console.log(`✅ モバイル用トークンを生成しました: ${MOBILE_TOKENS_PATH}（${Object.keys(vars).length} 変数）`);
}

// ── Figma API 取得 ────────────────────────────────────────────────

async function fetchFromFigmaApi(): Promise<FigmaTokenSet> {
    const token = process.env.FIGMA_TOKEN;
    const fileId = process.env.FIGMA_FILE_ID;

    if (!token || !fileId) {
        throw new Error(
            'FIGMA_TOKEN と FIGMA_FILE_ID 環境変数が必要です。\n' +
            '  export FIGMA_TOKEN=<your-token>\n' +
            '  export FIGMA_FILE_ID=<your-file-id>',
        );
    }

    console.log('Figma Variables API からトークンを取得中...');

    const response = await fetch(
        `https://api.figma.com/v1/files/${fileId}/variables/local`,
        { headers: { 'X-Figma-Token': token } },
    );

    if (!response.ok) {
        throw new Error(`Figma API エラー: ${response.status} ${response.statusText}`);
    }

    // biome-ignore lint/suspicious/noExplicitAny: Figma API レスポンス構造は動的
    const data = await response.json() as any;

    // Figma Variables API レスポンスをトークンセットに変換
    return parseFigmaApiResponse(data);
}

// biome-ignore lint/suspicious/noExplicitAny: Figma API レスポンス構造は動的
function parseFigmaApiResponse(data: any): FigmaTokenSet {
    const result: FigmaTokenSet = { colors: {}, spacing: {}, borderRadius: {} };

    const variables = data?.meta?.variables ?? {};
    const collections = data?.meta?.variableCollections ?? {};

    for (const [, variable] of Object.entries<any>(variables)) {
        const collection = collections[variable.variableCollectionId];
        const defaultModeId = collection?.defaultModeId;
        const resolvedValue = variable.valuesByMode?.[defaultModeId];

        if (!resolvedValue) continue;

        const name: string = variable.name.toLowerCase().replace(/\s+/g, '-');

        if (variable.resolvedType === 'COLOR') {
            const { r, g, b } = resolvedValue as { r: number; g: number; b: number };
            const hex = `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`;
            result.colors![name] = { value: hex, type: 'color' };
        } else if (variable.resolvedType === 'FLOAT') {
            if (name.includes('spacing') || name.includes('space') || name.includes('gap')) {
                const key = name.replace(/spacing[-\/]?/, '');
                result.spacing![key] = { value: String(Math.round(resolvedValue)), type: 'dimension', unit: 'px' };
            } else if (name.includes('radius')) {
                const key = name.replace(/radius[-\/]?/, '');
                result.borderRadius![key] = { value: String(Math.round(resolvedValue)), type: 'dimension', unit: 'px' };
            }
        }
    }

    return result;
}

// ── ローカル JSON 読み込み ────────────────────────────────────────

function loadFromJson(jsonPath: string): FigmaTokenSet {
    if (!fs.existsSync(jsonPath)) {
        throw new Error(`トークンファイルが見つかりません: ${jsonPath}\nFigmaからエクスポートして配置してください。`);
    }
    const content = fs.readFileSync(jsonPath, 'utf-8');
    return JSON.parse(content) as FigmaTokenSet;
}

// ── メイン ───────────────────────────────────────────────────────

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const useFigmaApi = args.includes('--figma');
    const inputIndex = args.indexOf('--input');
    const inputPath = inputIndex !== -1 ? args[inputIndex + 1] : DEFAULT_TOKENS_PATH;

    let tokens: FigmaTokenSet;

    if (useFigmaApi) {
        tokens = await fetchFromFigmaApi();
    } else {
        console.log(`ローカルトークンファイルから読み込み中: ${inputPath}`);
        tokens = loadFromJson(inputPath);
    }

    updateGlobalsCss(tokens);
    updateMobileTokens();

    console.log('📋 更新されたトークン:');
    if (tokens.colors) {
        console.log(`  カラー: ${Object.keys(tokens.colors).join(', ')}`);
    }
    if (tokens.spacing) {
        console.log(`  スペーシング: ${Object.keys(tokens.spacing).join(', ')}`);
    }
    if (tokens.borderRadius) {
        console.log(`  ボーダー半径: ${Object.keys(tokens.borderRadius).join(', ')}`);
    }
}

main().catch((err: unknown) => {
    console.error('❌ トークン同期に失敗しました:', err instanceof Error ? err.message : err);
    process.exit(1);
});
