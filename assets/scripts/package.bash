#!/usr/bin/env bash

cd "$(dirname $0)"
cd "$(git rev-parse --show-toplevel)"

pkg="blueprint-web"
dsc="Blueprint website configuration"
mtr="$(jq -r .author < package.json)"
ver="$(jq -r .version < package.json)"
rev=${1:-0}

deb="dist/${pkg}_${ver}-${rev}_all.deb"
if [[ -f "${deb}" ]]; then
    echo "package ${deb} already exists!"
    exit 1
fi

tmpdir=

function cleanup {
    set +e
    [[ -n "${tmpdir}" ]] && rm -rf "${tmpdir}"
    set +x
    [[ -f "${deb}" ]] && echo "done, created package ${deb}"
}

trap cleanup EXIT
set -ex

npm exec vite -- build \
    --force --mode production

tmpdir="$(mktemp --tmpdir -d blueprint.XXXXXXXXXXXX)"
root="${tmpdir}"

www="${root}/usr/share/blueprint-web/www"
mkdir -p "${www}"
for f in $(find dist/out -type f); do
    install -m 644 "$f" "${www}/${f:9}"
done

mkdir -p "${root}/etc/nginx/sites-available"
install -m 644 "assets/nginx.conf" "${root}/etc/nginx/sites-available/blueprint"

mkdir -p "${root}/DEBIAN"
install -m 755 "assets/postinst.bash" "${root}/DEBIAN/postinst"

ctl="${root}/DEBIAN/control"
touch "${ctl}"
echo "Package: ${pkg}" >> "${ctl}"
echo "Version: ${ver}" >> "${ctl}"
echo "Maintainer: ${mtr}" >> "${ctl}"
echo "Description: ${dsc}" >> "${ctl}"
echo "Architecture: all" >> "${ctl}"
echo "Depends: nginx-core" >> "${ctl}"

dpkg-deb --root-owner-group -b "${root}" "${deb}"
