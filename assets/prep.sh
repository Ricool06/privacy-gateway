#!/usr/bin/env bash
set -euo pipefail

ASSETS_FOLDER=$(dirname "$0")

wg genkey | tee "$ASSETS_FOLDER/client/client-private.key" | wg pubkey > "$ASSETS_FOLDER/server/client-public.key"

CLIENT_PUBLIC_KEY=$(cat "$ASSETS_FOLDER/server/client-public.key")

export CLIENT_PUBLIC_KEY

envsubst '$CLIENT_PUBLIC_KEY' < "$ASSETS_FOLDER/wg0-server.conf.template" > "$ASSETS_FOLDER/server/wg0-server.conf"


