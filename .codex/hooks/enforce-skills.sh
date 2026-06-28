#!/usr/bin/env bash
# 互換用エイリアス。実体は .github/hooks/enforce-flow.sh。
exec bash "$(git rev-parse --show-toplevel)/.github/hooks/enforce-flow.sh" "$@"
