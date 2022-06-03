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

export class NotImplementedError extends Error {
    constructor() {
        super('not implemented');
    }
}
