export function combine(...strings) {
    return strings.filter(s => s).join(' ');
}

export function genUniqueId(prefix) {
    let s = '';
    for (let i = 0; i < 6; i++) {
        s += String.fromCharCode(Math.random() * 256);
    }
    return prefix + btoa(s);
}

export function cancelBubble(ev) {
    if (ev.bubbles) {
        ev.stopPropagation();
    }
}

export function buttonUnfocusCallback(onClick) {
    return ev => {
        // XXX(iitalics): it's necessary to blur() buttons after you click on them, that
        // way the button stops capturing key events. this is especially important since
        // clicking the button can cause it to immediately become disabled=true, which
        // will cause it to swallow all key events without propogating them anywhere as
        // long as the button is focused.
        ev.currentTarget.blur();
        onClick && onClick();
    };
}

export class NotImplementedError extends Error {
    constructor() {
        super('not implemented');
    }
}
