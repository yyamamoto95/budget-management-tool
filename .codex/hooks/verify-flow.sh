#!/usr/bin/env bash
# Codex 用ポインタ。実体は .github/hooks/verify-flow.sh。
exec bash "$(git rev-parse --show-toplevel)/.github/hooks/verify-flow.sh" "$@"
