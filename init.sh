#!/usr/bin/env bash
# Inicia o servidor do projeto em http://localhost:8001 usando npm (http-server).
set -e
cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1; then
  echo "[init.sh] npm não encontrado. Instale o Node.js/npm primeiro." >&2
  exit 1
fi

# Instala http-server localmente apenas se ainda não estiver disponível.
if [ ! -x "node_modules/.bin/http-server" ]; then
  echo "[init.sh] instalando dependências (http-server)..."
  npm install --no-fund --no-audit --loglevel=error
fi

echo "[init.sh] iniciando servidor em http://localhost:8001"
setsid nohup npx --no-install http-server . -p 8001 -a 127.0.0.1 -c-1 --silent >/dev/null 2>&1 < /dev/null &
SERVER_PID=$!
echo "$SERVER_PID" > .server.pid
sleep 2
# aguarda o servidor responder (npx pode levar alguns segundos)
for i in $(seq 1 15); do
  curl -s -o /dev/null http://localhost:8001/ && break
  sleep 1
done
if curl -s -o /dev/null http://localhost:8001/; then
  echo "[init.sh] servidor ativo — http://localhost:8001"
else
  echo "[init.sh] falha ao iniciar o servidor." >&2
  exit 1
fi
