#!/usr/bin/env bash
# ============================================================
# verify-flow.sh — 実装後の品質確認チェック
#
# 実行順序:
#   1. codegen          — OpenAPI スペック生成 → 型定義生成
#   2. type-check       — 型整合性（codegen 後の型を含む）
#   3. test:unit        — 単体・コンポーネントテスト
#   4. test:integration — 統合テスト（実 DB 起動時のみ）
#
# ひとつでも失敗した時点で処理を中断する。
#
# 使い方:
#   bash .github/hooks/verify-flow.sh
#
# Claude Code: PostToolUse フックまたは /commit 前に手動実行
# Cursor / GitHub Copilot: 作業完了後に手動実行
# ============================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

echo ""
echo "========================================="
echo "  verify-flow: 実装後品質確認チェック"
echo "========================================="
echo ""

# ------------------------------------------------------------------
# 0. セキュリティ: 本番コードへの生クエリ混入チェック
# ------------------------------------------------------------------
echo "🔒 [0/4] 生クエリ混入チェック (apps/api/src/ テストを除く)..."
RAW_QUERY_HITS=$(grep -rn '\$queryRaw\|\$executeRaw\|\$executeRawUnsafe' \
  apps/api/src/ \
  --include="*.ts" \
  --exclude-dir="__tests__" 2>/dev/null || true)

if [ -n "$RAW_QUERY_HITS" ]; then
  echo ""
  echo "❌ 本番コードに生クエリが検出されました:"
  echo "$RAW_QUERY_HITS"
  echo ""
  echo "   Prisma の型安全な ORM クエリを使用してください。"
  echo "   やむを得ない場合は Prisma.sql タグ付きテンプレートを使用し、文字列結合は禁止です。"
  exit 1
fi
echo "✅ 生クエリチェック: OK"

# ------------------------------------------------------------------
# 1. OpenAPI スペック生成 → 型定義生成（codegen）
# ------------------------------------------------------------------
echo "⚙️  [1/4] API 定義整合性チェック (pnpm run codegen)..."
if ! pnpm run codegen 2>&1; then
  echo ""
  echo "❌ codegen が失敗しました。OpenAPI スペックと型定義の整合性を確認してください。"
  exit 1
fi
echo "✅ codegen: OK"

# ------------------------------------------------------------------
# 2. 型整合性チェック
# ------------------------------------------------------------------
echo ""
echo "🔍 [2/4] 型整合性チェック (pnpm run type-check)..."
if ! pnpm run type-check 2>&1; then
  echo ""
  echo "❌ 型エラーが検出されました。"
  exit 1
fi
echo "✅ 型チェック: OK"

# ------------------------------------------------------------------
# 3. 単体・コンポーネントテスト
# ------------------------------------------------------------------
echo ""
echo "🧪 [3/4] 単体・コンポーネントテスト (pnpm test:unit)..."
if ! pnpm test:unit 2>&1; then
  echo ""
  echo "❌ ユニットテストが失敗しました。"
  exit 1
fi
echo "✅ ユニットテスト: OK"

# ------------------------------------------------------------------
# 4. 統合テスト（実 DB）— DB コンテナが起動中の場合のみ実行
# ------------------------------------------------------------------
echo ""
echo "🗄️  [4/4] 統合テスト（実 DB）の確認..."
if nc -z 127.0.0.1 3307 2>/dev/null; then
  echo "  → テスト DB (port 3307) が起動中。統合テストを実行します..."
  if ! pnpm test:integration 2>&1; then
    echo ""
    echo "❌ 統合テストが失敗しました。"
    exit 1
  fi
  echo "✅ 統合テスト: OK"
else
  echo "  ⚠️  テスト DB (port 3307) が未起動のため統合テストをスキップします。"
  echo "     実行する場合: docker compose -f docker-compose.test.yml up -d"
fi

echo ""
echo "============================================================"
echo "✅ 全チェック通過。コミット可能です。"
echo "============================================================"
exit 0
