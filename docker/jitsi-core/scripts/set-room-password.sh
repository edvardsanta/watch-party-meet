#!/usr/bin/env bash
# Changes the default room password (WATCHPARTY_ROOM_PASSWORD) and recreates the
# prosody container so the new value takes effect. `docker compose restart` only
# restarts the existing container with the environment it was created with - it
# never re-reads .env - so this uses `up -d --force-recreate` instead. Recreating
# prosody also drops the current room (in-memory MUC storage), so the next join
# recreates it and the mod_muc_default_password.lua hook locks it with the new
# password.
set -euo pipefail

if [[ "${1:-}" != "--prompt" ]]; then
    echo "Usage: $0 --prompt" >&2
    echo "Prompts for the new room password in this terminal; it is never passed as an argument." >&2
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${CORE_DIR}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
    echo "No .env found at ${ENV_FILE}" >&2
    exit 1
fi

read -r -s -p "New room password: " password
printf '\n'
read -r -s -p "Confirm: " password_confirm
printf '\n'

if [[ -z "${password}" ]]; then
    echo "Password can't be empty." >&2
    exit 1
fi

if [[ "${password}" != "${password_confirm}" ]]; then
    echo "Passwords didn't match." >&2
    exit 1
fi

# A plain sed substitution would mangle passwords containing '&' (sed treats
# an unescaped '&' in the replacement text as "insert what matched"), so the
# file is rewritten line-by-line instead of relying on regex replacement.
tmp_file="$(mktemp "${ENV_FILE}.XXXXXX")"
trap 'rm -f "${tmp_file}"' EXIT

grep -v '^WATCHPARTY_ROOM_PASSWORD=' "${ENV_FILE}" > "${tmp_file}" || true
printf 'WATCHPARTY_ROOM_PASSWORD=%s\n' "${password}" >> "${tmp_file}"
mv "${tmp_file}" "${ENV_FILE}"
trap - EXIT

echo "Updated WATCHPARTY_ROOM_PASSWORD in ${ENV_FILE}" >&2

cd "${CORE_DIR}"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate prosody

echo "Recreated prosody. The new password applies to the room on its next creation (current session was dropped)." >&2
