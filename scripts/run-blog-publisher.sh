#!/bin/zsh
set -euo pipefail

PROJECT_DIR="/Users/johntang/Desktop/clients/medical-clinic/chinese-medicine"
cd "$PROJECT_DIR"

# Read BLOG_PUBLISH_CRON_SECRET safely from .env.local without sourcing.
BLOG_PUBLISH_CRON_SECRET="$(python3 - <<'PY'
from pathlib import Path

for line in Path(".env.local").read_text().splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, value = line.split("=", 1)
    if key.strip() == "BLOG_PUBLISH_CRON_SECRET":
        print(value.strip().strip('"').strip("'"))
        break
PY
)"

if [[ -z "${BLOG_PUBLISH_CRON_SECRET}" ]]; then
  echo "BLOG_PUBLISH_CRON_SECRET is missing in .env.local" >&2
  exit 1
fi

curl -sS -X POST "http://localhost:3003/api/admin/blog/publish-due" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: ${BLOG_PUBLISH_CRON_SECRET}" \
  -d '{}'
