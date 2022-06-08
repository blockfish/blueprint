#!/usr/bin/env bash

cd "$(dirname $0)"
cd "$(git rev-parse --show-toplevel)"

set -ex

convert resources/icon/640x640.png \
        -resize 16x16 \
        resources/icon/16x16.ico

convert resources/icon/640x640.png \
        -resize 160x160 \
        resources/icon/160x160.png
