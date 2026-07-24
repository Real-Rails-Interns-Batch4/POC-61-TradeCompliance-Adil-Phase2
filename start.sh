#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# start.sh  –  Container entrypoint that runs both services
# ─────────────────────────────────────────────────────────────────────────────
set -e

# ── 1. Start the FastAPI backend ──────────────────────────────────────────────
echo "▶  Starting FastAPI backend on port 8000..."
cd /app
python -m uvicorn backend.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 2 \
    --log-level info &
BACKEND_PID=$!

# ── 2. Wait for the backend to be ready before starting the frontend ──────────
echo "⏳  Waiting for backend to be healthy..."
for i in $(seq 1 30); do
    if curl -sf http://localhost:8000/api/metrics > /dev/null 2>&1; then
        echo "✅  Backend is healthy."
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "❌  Backend failed to start after 30 seconds. Check logs above."
        exit 1
    fi
    sleep 1
done

# ── 3. Start the Next.js standalone server ────────────────────────────────────
echo "▶  Starting Next.js frontend on port 3000..."
export PORT=3000
export HOSTNAME=0.0.0.0
export API_BASE_URL="http://localhost:8000"
cd /app/frontend
node server.js &
FRONTEND_PID=$!

echo "🚀  Both services are up!"
echo "   Frontend → http://localhost:3000"
echo "   Backend  → http://localhost:8000"

# ── 4. Trap signals and exit if either process dies ──────────────────────────
_term() {
    echo "🛑  Caught shutdown signal. Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}
trap _term SIGTERM SIGINT

# Keep container alive; exit if either child process dies
wait $BACKEND_PID $FRONTEND_PID
