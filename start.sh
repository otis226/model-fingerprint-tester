#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
( sleep 1; python3 -m webbrowser http://127.0.0.1:8787 >/dev/null 2>&1 || true ) &
npm start
