#!/usr/bin/env bash
# ============================================================
# check-doc-links.sh — SSOT ドキュメントのリンク切れ検出
#
# .github/**/*.md 内で参照される「.github/ または docs/ ルートの
# リポジトリ相対パス」が実在するかを検証する。
# 移設・削除でリンクが宙に浮くのを機械的に検出するためのガードレール。
#
# 検証対象を .github/ と docs/ に限定する理由:
#   - この2ルートは SSOT ドキュメント本体であり、腐敗の影響が大きい
#   - apps/ packages/ のソースパスは ADR 等の「例示」で頻繁に動くため、
#     強制すると誤検知・摩擦の温床になる（意図的に対象外）
#
# 使い方: bash scripts/check-doc-links.sh  （リポジトリルートで実行）
# 終了コード: 0=OK / 1=リンク切れあり
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# プレースホルダやグロブを含まない、.github/ または docs/ 始まりのパストークンを抽出。
# 文字クラスに * < > { } ( ) 空白等を含めないことで、例示・グロブを自然に除外する。
PATTERN='(\.github|docs)/[A-Za-z0-9._/-]+'

broken=0
checked=0

while IFS= read -r file; do
  # 各行から候補トークンを抽出（backtick/markdown リンク/素のテキストを問わず）
  while IFS= read -r token; do
    [ -z "$token" ] && continue
    # 末尾のスラッシュはディレクトリ参照として扱い、除去してから存在確認する
    path="${token%/}"
    checked=$((checked + 1))
    if [ ! -e "$path" ]; then
      echo "❌ ${file}: 参照先が存在しません → ${token}"
      broken=$((broken + 1))
    fi
  done < <(grep -oE "$PATTERN" "$file" | sort -u)
done < <(find .github -name '*.md' -type f | sort)

echo ""
echo "検証済みトークン: ${checked} 件 / リンク切れ: ${broken} 件"

if [ "$broken" -gt 0 ]; then
  echo ""
  echo "SSOT ドキュメントにリンク切れがあります。参照先を修正するか、"
  echo "移動先の現行パスへ更新してください（.github/sprint-protocol.md セクション5参照）。"
  exit 1
fi

echo "✅ .github/ ドキュメント内の .github/・docs/ 参照はすべて有効です。"
