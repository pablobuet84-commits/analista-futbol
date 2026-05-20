#!/usr/bin/env bash
set -e

apt-get update -qq
apt-get install -y -qq nodejs

pip install -r requirements.txt
