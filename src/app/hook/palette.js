import { Palette } from '../model/palette'

const DEFAULT_PALETTE = new Palette('g', false);

export function usePalette(db) {
    let [palette, setPalette] = React.useState(db.load('palette') || DEFAULT_PALETTE);
    React.useEffect(() => db.store('palette', palette), [db, palette]);
    return [palette, setPalette];
}
