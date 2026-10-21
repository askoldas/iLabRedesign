#!/usr/bin/env bash
# Usage: ./tools-shot.sh <url> <out.png> [width] [height]
# Headless Chromium screenshot with virtual time so GSAP entrances finish.
CHROME="${CHROME:-$HOME/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome}"
W="${3:-1440}"; H="${4:-4000}"
"$CHROME" --headless=new --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size="$W,$H" --virtual-time-budget=8000 --screenshot="$2" "$1" >/dev/null 2>&1
