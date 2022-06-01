![Blueprint Logo](resources/icon/favicon-640x640.png)

# [Blueprint][bp]

Blueprint is modern new tetris board-editing tool for practicing, sharing setups,
analyzing situations, and more. It is intended to be a successor to the popular tool known
as [fumen][fumen].

## Local development

This repo includes a script [dev.bash](scripts/dev.bash) to automatically set up a [http
server][http-server-npm] to test the app. The script probably only works on linux, and
will automatically rebuild when changes are detected:

    $ ./scripts/dev.bash
    + ...
    + (omitted)
    + ...
    [watch] build finished, watching for changes...
    Compiled src/style/index.scss to .dev/index.css.
    Sass is watching for changes. Press Ctrl-C to stop.

## Deployment

Blueprint is deployed with nginx running on debian. You can use the
[dist.bash](scripts/dist.bash) script to build a `.deb` package in the `dist/` folder,
which can then be used to set up the website.

    $ ./scripts/dist.bash
    + ...
    + (omitted)
    + ...
    dpkg-deb: building package 'blueprint-web' in 'dist/blueprint-web_0.0.1-0_all.deb'.
    + ...
    $ scp ./dist/blueprint-web_0.0.1-0_all.deb talisoftware:
    talisoftware# apt install ./blueprint-web_0.0.1-0_all.deb
    ... (omitted) ...
    talisoftware# ln -s ../sites-available/blueprint /etc/nginx/sites-enabled
    talisoftware# systemctl restart nginx

[bp]: https://bp.tali.software/
[fumen]: http://fumen.zui.jp/
[http-server-npm]: https://www.npmjs.com/package/http-server
