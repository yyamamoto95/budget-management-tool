#!/usr/bin/env bash
# Codex 用ポインタ。実体は .github/hooks/enforce-ui-wrapper.sh。
exec bash "$(git rev-parse --show-toplevel)/.github/hooks/enforce-ui-wrapper.sh" "$@"
