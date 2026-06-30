#!/usr/bin/env bash
# Convenience launcher for the Redis semantic-cache demo (PHP).
#
# Reads SEMCACHE_* environment variables for configuration (see
# `_index.md`) and starts PHP's built-in dev server with the
# `public/index.php` front controller. The `-d post_max_size=1M`
# override is deliberate: php.ini's default of 8M is generous for a
# demo whose largest legitimate body is a few hundred bytes of
# form-encoded query fields, and the smaller cap is paired with the
# defensive Content-Length check inside the front controller so a
# malformed POST is rejected at the SAPI layer with an empty $_POST
# rather than accumulated in memory.

set -euo pipefail

HOST="${SEMCACHE_HOST:-127.0.0.1}"
PORT="${SEMCACHE_PORT:-8093}"

cd "$(dirname "$0")"

if [[ ! -d vendor ]]; then
    echo "vendor/ is missing — run 'composer install' first." >&2
    exit 1
fi

exec php \
    -d post_max_size=1M \
    -d upload_max_filesize=1M \
    -d memory_limit=256M \
    -d error_reporting='E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED' \
    -d display_errors=0 \
    -d ffi.enable=true \
    -S "${HOST}:${PORT}" \
    -t public \
    public/index.php
