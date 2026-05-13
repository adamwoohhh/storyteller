#!/bin/bash
set -e

echo "node version is " && node -v

source /etc/profile

# echo "nvm version is " && nvm --version

# nvm use 22

# install dependencies
pnpm i

pnpm run build