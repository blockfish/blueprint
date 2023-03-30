#!/usr/bin/env bash

cd "$(dirname $0)"
cd "$(git rev-parse --show-toplevel)"

set -ex

convert assets/icon/640x640.png \
        -resize 16x16 \
        assets/icon/16x16.ico

convert assets/icon/640x640.png \
        -resize 160x160 \
        assets/icon/160x160.png
