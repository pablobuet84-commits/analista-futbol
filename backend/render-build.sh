#!/usr/bin/env bash
set -e

pip install -r requirements.txt

curl -fsSL https://nodejs.org/dist/v22.0.0/node-v22.0.0-linux-x64.tar.xz -o /tmp/node.tar.xz
mkdir -p /opt/render/project/.node
tar xf /tmp/node.tar.xz -C /opt/render/project/.node --strip-components=1



