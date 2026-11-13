#!/usr/bin/env bash
# Encerra o servidor iniciado por init.sh.
cd "$(dirname "$0")"

if [ -f .server.pid ]; then
  PID="$(cat .server.pid)"
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null
    # derruba processos remanescentes do http-server no mesmo diretório
    pkill -f "http-server" 2>/dev/null || true
    echo "[stop.sh] servidor (PID $PID) encerrado."
  else
    echo "[stop.sh] servidor já estava inativo."
  fi
  rm -f .server.pid
else
  pkill -f "http-server.*-p 8001" 2>/dev/null || true
  echo "[stop.sh] nenhum PID registrado; processos do http-server na porta 8001 encerrados (se existiam)."
fi
