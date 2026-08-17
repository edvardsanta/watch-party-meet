#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
    echo "Usage: $0 USER[:PASSWORD] USER[:PASSWORD] [...]" >&2
    echo "If PASSWORD is omitted, a random one is generated." >&2
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${CORE_DIR}/.env"

CONFIG_DIR="${CONFIG:-}"
if [[ -z "${CONFIG_DIR}" && -f "${ENV_FILE}" ]]; then
    CONFIG_DIR="$(awk -F= '/^CONFIG=/{ print $2; exit }' "${ENV_FILE}")"
fi
CONFIG_DIR="${CONFIG_DIR:-~/.jitsi-meet-cfg}"
CONFIG_DIR="${CONFIG_DIR/#\~/${HOME}}"

AUTH_FILE="${CINEMA_BASIC_AUTH_FILE:-}"
if [[ -z "${AUTH_FILE}" && -f "${ENV_FILE}" ]]; then
    AUTH_FILE="$(awk -F= '/^CINEMA_BASIC_AUTH_FILE=/{ print $2; exit }' "${ENV_FILE}")"
fi
AUTH_FILE="${AUTH_FILE:-/config/nginx/cinema.htpasswd}"

if [[ "${AUTH_FILE}" == /config/* ]]; then
    AUTH_FILE="${CONFIG_DIR}/web${AUTH_FILE#/config}"
fi

mkdir -p "$(dirname "${AUTH_FILE}")"
: > "${AUTH_FILE}"
chmod 644 "${AUTH_FILE}"

for entry in "$@"; do
    user="${entry%%:*}"
    password=""

    if [[ "${entry}" == *:* ]]; then
        password="${entry#*:}"
    else
        password="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-18)"
    fi

    if [[ -z "${user}" || -z "${password}" ]]; then
        echo "Invalid user/password entry: ${entry}" >&2
        exit 1
    fi

    hash="$(openssl passwd -apr1 "${password}")"
    printf '%s:%s\n' "${user}" "${hash}" >> "${AUTH_FILE}"
    printf '%s:%s\n' "${user}" "${password}"
done

echo "Wrote ${AUTH_FILE}" >&2
