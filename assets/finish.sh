#!/usr/bin/env bash
set -euo pipefail

ASSETS_FOLDER=$(dirname "$0")

S3_ASSETS_BUCKET_URL="$(aws --profile privacy-gateway \
  cloudformation describe-stacks \
  --stack-name PrivacyGatewayStack \
  --query "Stacks[0].Outputs[?OutputKey=='s3AssetsBucketUrl'].OutputValue" \
  --output text)"

SERVER_ENDPOINT="$(aws --profile privacy-gateway \
  cloudformation describe-stacks \
  --stack-name PrivacyGatewayStack \
  --query "Stacks[0].Outputs[?OutputKey=='vpnEndpoint'].OutputValue" \
  --output text)"

aws --profile privacy-gateway \
  s3 cp \
  "${S3_ASSETS_BUCKET_URL}server-public.key" \
  "$ASSETS_FOLDER/client/server-public.key"

SERVER_PUBLIC_KEY="$(cat "$ASSETS_FOLDER/client/server-public.key")"
CLIENT_PRIVATE_KEY=$(cat "$ASSETS_FOLDER/client/client-private.key")
export SERVER_PUBLIC_KEY
export CLIENT_PRIVATE_KEY
export SERVER_ENDPOINT

envsubst '$CLIENT_PRIVATE_KEY $SERVER_PUBLIC_KEY $SERVER_ENDPOINT' < "$ASSETS_FOLDER/wg0-client.conf.template" > "$ASSETS_FOLDER/client/wg0-client.conf"
