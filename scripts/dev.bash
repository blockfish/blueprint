#!/usr/bin/bash

readonly PORT=8080

cd "$(dirname $0)"
cd "$(git rev-parse --show-toplevel)"

sass_pid=
esb_pid=
ejs_pid=

function cleanup {
    for pid in ${sass_pid} ${esb_pid} ${ejs_pid}; do
        kill -- "-$pid"
    done
    echo "bye"
}

trap cleanup SIGINT SIGTERM EXIT

set -mx

if ! test -d node_modules/http-server; then
    npm install . --production=false ||
        exit 1
fi

if ! test -d .dev/public; then
    mkdir -p .dev/public
    ln -s ../index.html .dev/public/index.html
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
        --loader:.bin=binary \
        --sourcemap=inline \
        --platform=browser \
        --watch
}

function ejs {
    set +x
    local curStat
    local newStat
    local gitRev

    while true; do
        if [[ "${curStat}" == "${newStat}" ]]; then
            gitRev="$(git log --format=%h -n1)"
            newStat="$(stat -c%Z package.json) $(stat -c%Z ./src/index.ejs) ${gitRev}"
        else
            npx ejs ./src/index.ejs --output-file .dev/index.html \
                --rm-whitespace --strict \
                --data-file ./package.json \
                "gitRev=${gitRev}" \
                "port=${PORT}"

            curStat="${newStat}"
            echo "Rendered index.html."
        fi
        sleep 0.5
    done
}

sass &
sass_pid=$!

esb &
esb_pid=$!

ejs &
ejs_pid=$!

npx http-server .dev/public \
    --port "${PORT}" \
    --no-dotfiles \
    --silent \
    -c-1 \
