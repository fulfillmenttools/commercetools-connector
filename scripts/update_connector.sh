#!/usr/bin/env bash

if [ X"$1" = X ]; then
  echo "Usage: $(basename "$0") <version>"
  exit 0
fi

if [ -z "$CT_CLIENT_ID" ] || [ -z "$CT_CLIENT_SECRET" ]; then
  echo "Error: Missing required environment CT_CLIENT_ID, CT_CLIENT_SECRET"
  exit 1
fi

set -eu

VERSION="$1"

ROOT="$(dirname "$(readlink -f "$0")")"
cd "$ROOT/.." || exit 1

CONNECTOR_KEY=fft-connect-app

# obtain access token
AUTH_TOKEN="$(echo -n "$CT_CLIENT_ID:$CT_CLIENT_SECRET" | base64)"
API_TOKEN="$(curl -fsSL -X POST 'https://auth.europe-west1.gcp.commercetools.com/oauth/token?grant_type=client_credentials' \
  -H 'Content-Type: application/json' -H "Authorization: Basic ${AUTH_TOKEN}" -d '' 2>/dev/null | jq -r '.access_token')"

if [ -z "$API_TOKEN" ]; then
  echo "Error: Could not obtain access token"
  exit 1
fi

# get ConnectorDraft version
JSON="$(curl -fsSL "https://connect.europe-west1.gcp.commercetools.com/connectors/drafts/key=${CONNECTOR_KEY}" \
  -H 'Content-Type: application/json' -H "Authorization: Bearer ${API_TOKEN}" 2>/dev/null)"

CONNECTOR_VERSION="$( echo "$JSON" | jq -r '.version')"
if [ -z "$CONNECTOR_VERSION" ]; then
  echo "Error: Could not determine connector version"
  exit 1
fi

GIT_VERSION="$( echo "$JSON" | jq -r '.repository.tag')"
if [ "$GIT_VERSION" == "$VERSION" ]; then
  echo "Connector already has git tag $GIT_VERSION, nothing to do"
  exit 0
fi

# update ConnectorDraft version
PAYLOAD=$(cat <<EOF
{
    "version": $CONNECTOR_VERSION,
    "actions": [
        {
            "action": "setRepository",
            "url": "git@github.com:fulfillmenttools/commercetools-connector.git",
            "tag": "$VERSION"
        }
    ]
}
EOF
)

JSON="$(curl -fsSL "https://connect.europe-west1.gcp.commercetools.com/connectors/drafts/key=${CONNECTOR_KEY}" \
  -H 'Content-Type: application/json' -H "Authorization: Bearer ${API_TOKEN}" --data-raw "$PAYLOAD" 2>/dev/null)"

CONNECTOR_VERSION="$(echo "$JSON" | jq -r '.version')"
if [ -z "$CONNECTOR_VERSION" ]; then
  echo "Error: Could not update connector version"
  exit 1
fi

CONNECTOR_PREVIEW="$( echo "$JSON" | jq -r '.isPreviewable')"
if [ "$CONNECTOR_PREVIEW" == "true" ]; then
  echo "Connector already has preview state, nothing to do"
  exit 0
fi

# update ConnectorDraft preview status
PAYLOAD=$(cat <<EOF
{
    "version": $CONNECTOR_VERSION,
    "actions": [
        {
            "action": "updatePreviewable"
        }
    ]
}
EOF
)

JSON="$(curl -fsSL "https://connect.europe-west1.gcp.commercetools.com/connectors/drafts/key=${CONNECTOR_KEY}" \
  -H 'Content-Type: application/json' -H "Authorization: Bearer ${API_TOKEN}" --data-raw "$PAYLOAD" 2>/dev/null)"

CONNECTOR_VERSION="$(echo "$JSON" | jq -r '.version')"
if [ -z "$CONNECTOR_VERSION" ]; then
  echo "Error: Could not update connector preview"
  exit 1
fi

echo "version: $CONNECTOR_VERSION"
echo "hasChanges: $(echo "$JSON" | jq -r '.hasChanges')"
echo "alreadyListed: $(echo "$JSON" | jq -r '.alreadyListed')"
echo "isPreviewable: $(echo "$JSON" | jq -r '.isPreviewable')"
echo "status: $(echo "$JSON" | jq -r '.status')"
echo "Done."
