import { Key, Keymap } from '../model/keymap'
import { Handling } from '../model/handling'
import { Palette } from '../model/palette'

const KEYMAP_ACTIONS = [
    'ccw', 'cw', 'del-page', 'drop', 'hold', 'left', 'lock', 'new-page',
    'next-page', 'prev-page', 'redo', 'reset', 'right', 'tab1', 'tab2', 'tab3',
    'tab4', 'toggle', 'undo', 'flip'
];

export function save(dbMap) {
    let userData = {};
    if (dbMap.has('handling')) {
        let { das, arr, sdr } = dbMap.get('handling');
        userData['h'] = [das, arr, sdr];
    }
    if (dbMap.has('keymap')) {
        userData['k'] = KEYMAP_ACTIONS.map(action => {
            let key = dbMap.get('keymap').getBinding(action);
            return key ? key.name : '';
        });
    }
    if (dbMap.has('tab')) {
        userData['t'] = dbMap.get('tab');
    }
    if (dbMap.has('palette')) {
        let { color, fillRow } = dbMap.get('palette');
        userData['p'] = fillRow ? `${color}*` : color;
    }
    return { user: JSON.stringify(userData) };
}

export function restore({ user }) {
    let userData = JSON.parse(user);
    let dbMap = new Map();
    if (userData['h'] !== undefined) {
        let [das, arr, sdr] = userData['h'];
        dbMap.set('handling', new Handling(das, arr, sdr));
    }
    if (userData['k'] !== undefined) {
        let bindings = KEYMAP_ACTIONS
            .map((action, i) => {
                let keyName = userData['k'][i];
                return keyName ? [action, Key.get(keyName)] : null;
            })
            .filter(e => e !== null);
        dbMap.set('keymap', new Keymap(bindings));
    }
    if (userData['t'] !== undefined) {
        dbMap.set('tab', userData['t']);
    }
    if (userData['p'] !== undefined) {
        let [color, fillRowChar] = userData['p'];
        dbMap.set('palette', new Palette(color, !!fillRowChar));
    }
    return dbMap;
}
