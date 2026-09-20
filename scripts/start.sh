#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

# 引导内置 PostgreSQL（幂等）：部署容器无外部数据库，
# 首次启动自动 initdb + 灌入 db/seed.sql 种子数据；失败不阻断应用启动
node "${COZE_WORKSPACE_PATH}/scripts/prod-db.mjs" || echo "[start.sh] DB bootstrap failed, continuing..."

start_service() {
    cd "${COZE_WORKSPACE_PATH}"
    echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
    PORT=${DEPLOY_RUN_PORT} node dist/server.js
}

start_service
