#!/usr/bin/bash

cd "$(dirname $0)"
cd "$(git rev-parse --show-toplevel)"

function safekill {
    if ps "$1" >/dev/null 2>/dev/null; then
        kill -2 "$1"
    fi
}

sass_pid=
esb_pid=

function cleanup {
    safekill "${sass_pid}"
    safekill "${esb_pid}"
}

trap cleanup EXIT
set -mx

if ! test -d node_modules/http-server; then
    npm install . --production=false ||
        exit 1
fi

if ! test -d .dev/public; then
    mkdir -p .dev/public
    ln -s ../../src/index.dev.html .dev/public/index.html
    ln -s ../../resources/icon/16x16.ico .dev/public/favicon.ico
    ln -s ../index.css .dev/public/style.css
    ln -s ../app.js .dev/public/bundle.js
    wget -P .dev/public 'https://unpkg.com/react@18/umd/react.development.js' || exit 1
    wget -P .dev/public 'https://unpkg.com/react-dom@18/umd/react-dom.development.js' || exit 1
fi

function sass {
    exec npx sass "src/style/index.scss:.dev/index.css" \
        --no-error-css \
        --embed-sources \
        --embed-source-map \
        --watch
}

function esb {
    exec npx esbuild ./src/app --outdir=.dev \
        --bundle --global-name=App \
        --sourcemap=inline \
        --platform=browser \
        --watch
}

sass &
sass_pid=$!

esb &
esb_pid=$!

npx http-server .dev/public \
    --no-dotfiles \
    -s \
    -c-1 \
