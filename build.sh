#!/bin/bash
set -e

echo "node version is " && node -v

source /etc/profile

# echo "nvm version is " && nvm --version

# nvm use 22

ensure_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    echo "pnpm version is " && pnpm --version
    return
  fi

  echo "pnpm not found, installing pnpm..."
  if command -v corepack >/dev/null 2>&1; then
    corepack enable
    corepack prepare pnpm@latest --activate
  elif command -v npm >/dev/null 2>&1; then
    npm install -g pnpm --registry https://bnpm.byted.org
  else
    echo "Error: npm or corepack is required to install pnpm." >&2
    exit 1
  fi

  echo "pnpm version is " && pnpm --version
}

ensure_pnpm

# install dependencies
pnpm i --registry https://bnpm.byted.org

pnpm run build
