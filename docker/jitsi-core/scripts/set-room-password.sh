#!/usr/bin/env bash
# Changes the default room password (WATCHPARTY_ROOM_PASSWORD) and restarts prosody
# so the new value takes effect. Restarting prosody drops the current room
# (in-memory MUC storage), so the next join recreates it and the
# mod_muc_default_password.lua hook locks it with the new password.
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

if grep -q '^WATCHPARTY_ROOM_PASSWORD=' "${ENV_FILE}"; then
    sed -i "s|^WATCHPARTY_ROOM_PASSWORD=.*|WATCHPARTY_ROOM_PASSWORD=${password}|" "${ENV_FILE}"
else
    printf 'WATCHPARTY_ROOM_PASSWORD=%s\n' "${password}" >> "${ENV_FILE}"
fi

echo "Updated WATCHPARTY_ROOM_PASSWORD in ${ENV_FILE}" >&2

cd "${CORE_DIR}"
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart prosody

echo "Restarted prosody. The new password applies to the room on its next creation (current session was dropped)." >&2
