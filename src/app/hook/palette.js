import { Palette } from '../model/palette'

export function usePalette(db) {
    let [palette, dispatchPalette] = React.useReducer(reduce, db, init);
    React.useEffect(() => db.store('palette', palette), [db, palette]);
    return [palette, dispatchPalette];
}

function init(db) {
    return db.load('palette') || new Palette('g', true);
}

function reduce(palette, action) {
    return action(palette);
}
