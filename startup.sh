#!/bin/sh
set -e

echo "=================================================="
echo "🚀 Starting VOICEX AI Platform on Azure App Service"
echo "Current directory: $(pwd)"
echo "Port: ${PORT:-8080}"
echo "=================================================="

export PORT="${PORT:-8080}"
export HOSTNAME="0.0.0.0"
export NODE_ENV="production"

# Check available files
if [ -f "apps/web/.next/standalone/apps/web/server.js" ]; then
  echo "Found standalone apps/web/server.js -> Starting..."
  exec node apps/web/.next/standalone/apps/web/server.js
elif [ -f "apps/web/.next/standalone/server.js" ]; then
  echo "Found standalone server.js -> Starting..."
  exec node apps/web/.next/standalone/server.js
elif [ -d "apps/web/.next" ]; then
  echo "Found apps/web/.next production build -> Starting next start..."
  exec npx next start apps/web -p "$PORT" -H 0.0.0.0
else
  echo "Fallback -> Starting via npm start..."
  exec npm run start --filter=web
fi
