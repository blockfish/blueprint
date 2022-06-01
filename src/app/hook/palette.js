import { Palette } from '../model/palette'

export function usePalette() {
    return React.useReducer(reduce, null, init);
}

function init() {
    // TODO [#2] init from localstorage
    return new Palette('g', true);
}

function reduce(palette, action) {
    return action(palette);
}
