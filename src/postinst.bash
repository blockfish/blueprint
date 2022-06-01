#!/usr/bin/env bash

function reinstall_certbot {
    local cb
    local dir
    local dom

    if ! cb="$(which certbot 2>/dev/null)"; then
        echo "cerbot is not installed. you should set up letsencrypt"
        return 0
    fi

    for dir in /etc/letsencrypt/live/*; do
        dom="$(basename "${dir}")"
        if [[ "$dom" =~ ^bp\. ]]; then
            echo "running 'certbot install' as part of postinst hook"
            "${cb}" install -n --nginx --cert-name "${dom}"
        fi
    done
}

reinstall_certbot
