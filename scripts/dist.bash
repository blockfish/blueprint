#!/usr/bin/env bash

cd "$(dirname $0)"
cd "$(git rev-parse --show-toplevel)"

pkg="blueprint-web"
dsc="Blueprint website configuration"
mtr="$(jq -r .author < package.json)"
ver="$(jq -r .version < package.json)"
rev=${1:-0}

tmpdir=

function cleanup {
    set +e
    [[ -n "${tmpdir}" ]] && rm -rf "${tmpdir}"
}

trap cleanup EXIT
set -ex

tmpdir="$(mktemp -d blueprint.XXXXXXXXXXXX)"
root="${tmpdir}/root"

npm install . --production=true || exit 1

# TODO [#12] should lint before building

npx esbuild ./src/app --outdir="${tmpdir}" \
    --bundle \
    --platform=browser \
    --minify

npx sass src/style/index.scss "${tmpdir}/style.css" \
    --no-source-map \
    --style=compressed

npx ejs \
    -f package.json -l pkg \
    -w \
    -o "${tmpdir}/index.html" \
    src/index.prod.ejs

www="${root}/usr/share/blueprint-web/www"
mkdir -p "${www}" "${root}/etc/nginx/sites-available"
install -m 644 "${tmpdir}/app.js" "${www}/bundle.js"
install -m 644 "${tmpdir}/style.css" "${www}/style.css"
install -m 644 "${tmpdir}/index.html" "${www}/index.html"
install -m 644 "resources/icon/16x16.ico" "${www}/favicon.ico"
install -m 644 "src/nginx.conf" "${root}/etc/nginx/sites-available/blueprint"

ctl="${root}/DEBIAN/control"
mkdir -p "${root}/DEBIAN"
install -m 755 "src/postinst.bash" "${root}/DEBIAN/postinst"
echo "Package: ${pkg}" > "${ctl}"
echo "Version: ${ver}" >> "${ctl}"
echo "Maintainer: ${mtr}" >> "${ctl}"
echo "Description: ${dsc}" >> "${ctl}"
echo "Architecture: all" >> "${ctl}"
echo "Depends: nginx-core" >> "${ctl}"

deb="dist/${pkg}_${ver}-${rev}_all.deb"
mkdir -p dist
dpkg-deb --root-owner-group -b "${root}" "${deb}"

