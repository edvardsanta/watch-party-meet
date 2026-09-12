#!/usr/bin/env bash
#
# Build local e exportação da imagem Docker web para um droplet.
#
# Uso:
#   DROPLET_HOST=example.com ./scripts/build-local-export-droplet.sh
#
# Variáveis:
#   PLATFORM          Plataforma alvo. Padrão: linux/amd64
#   TAG               Tag da imagem. Padrão: git short sha ou latest
#   WEB_IMAGE_NAME    Nome da imagem web. Padrão: watchparty/jitsi-web
#   DROPLET_HOST      Hostname/IP do droplet. Obrigatório para upload
#   DROPLET_USER      Usuário SSH. Padrão: root
#   SSH_PORT          Porta SSH. Padrão: 22
#   SSH_KEY_PATH      Caminho para chave SSH privada
#   SAVE_IMAGES_ONLY  Se "true", builda sem enviar
#   SKIP_WEB_BUILD    Se "true", pula make compile deploy
#   JITSI_IMAGE_REPO  Repo base das imagens Jitsi. Padrão: docker.io/jitsi
#   JITSI_IMAGE_VERSION Versão base Jitsi. Padrão: stable-10978
#
# Exemplos:
#   SAVE_IMAGES_ONLY=true ./scripts/build-local-export-droplet.sh
#   DROPLET_HOST=meet.example.com ./scripts/build-local-export-droplet.sh
#   PLATFORM=linux/arm64 DROPLET_HOST=meet.example.com ./scripts/build-local-export-droplet.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if git -C "$ROOT_DIR" rev-parse --short HEAD >/dev/null 2>&1; then
  DEFAULT_TAG="$(git -C "$ROOT_DIR" rev-parse --short HEAD)"
else
  DEFAULT_TAG="latest"
fi

TAG="${TAG:-$DEFAULT_TAG}"
WEB_IMAGE_NAME="${WEB_IMAGE_NAME:-watchparty/jitsi-web}"
WEB_IMAGE="${WEB_IMAGE_NAME}:${TAG}"
PLATFORM="${PLATFORM:-linux/amd64}"
JITSI_IMAGE_REPO="${JITSI_IMAGE_REPO:-docker.io/jitsi}"
JITSI_IMAGE_VERSION="${JITSI_IMAGE_VERSION:-stable-10978}"

DROPLET_USER="${DROPLET_USER:-root}"
DROPLET_HOST="${DROPLET_HOST:-}"
SSH_PORT="${SSH_PORT:-22}"
SSH_KEY_PATH="${SSH_KEY_PATH:-}"

SSH_ARGS=(-p "$SSH_PORT")
if [[ -n "$SSH_KEY_PATH" ]]; then
  SSH_ARGS+=(-i "$SSH_KEY_PATH")
fi

if [[ "${SKIP_WEB_BUILD:-}" != "true" ]]; then
  echo ">> Compilando assets web locais"
  (
    cd "$ROOT_DIR"
    make compile deploy
  )
else
  echo ">> Pulando build web local por SKIP_WEB_BUILD=true"
fi

echo ">> Build da imagem web: ${WEB_IMAGE} (platform: ${PLATFORM})"
(
  cd "$ROOT_DIR"
  docker buildx build \
    --platform "$PLATFORM" \
    --load \
    -f docker/jitsi-core/web/Dockerfile.local \
    -t "$WEB_IMAGE" \
    --build-arg "JITSI_IMAGE_REPO=${JITSI_IMAGE_REPO}" \
    --build-arg "JITSI_IMAGE_VERSION=${JITSI_IMAGE_VERSION}" \
    .
)

if [[ "${SAVE_IMAGES_ONLY:-}" == "true" ]]; then
  echo ">> Imagem construída localmente: ${WEB_IMAGE}"
  echo ">> Para usar no compose prebuilt: WEB_IMAGE=${WEB_IMAGE}"
  exit 0
fi

if [[ -z "$DROPLET_HOST" ]]; then
  echo "Defina DROPLET_HOST para enviar a imagem via SSH." >&2
  exit 1
fi

echo ">> Enviando imagem web por stream (docker save | docker load)"
docker save "$WEB_IMAGE" | ssh "${SSH_ARGS[@]}" "${DROPLET_USER}@${DROPLET_HOST}" "docker load"
ssh "${SSH_ARGS[@]}" "${DROPLET_USER}@${DROPLET_HOST}" "docker image inspect '${WEB_IMAGE}' >/dev/null 2>&1 || docker tag 'localhost/${WEB_IMAGE}' '${WEB_IMAGE}'"

echo "Imagem carregada com sucesso no droplet."
echo "Use este valor no docker-compose.prebuilt.yml:"
echo "  WEB_IMAGE=${WEB_IMAGE}"
