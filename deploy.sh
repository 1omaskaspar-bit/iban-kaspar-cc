#!/bin/bash
set -e
ssh jarvis@100.107.101.126 "
  cd ~/projects/iban-kaspar-cc &&
  git pull &&
  npm install --omit=dev &&
  npm run build &&
  npx pm2 restart iban-kaspar-cc
"
