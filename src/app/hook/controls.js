import { Keymap, Key } from '../model/keymap'
import { Handling } from '../model/handling'

const DEFAULT_KEYMAP = new Keymap(function*() {
    yield ['undo', Key.get('Ctrl-Z')];
    yield ['redo', Key.get('Ctrl-Y')];
    yield ['tab1', Key.get('1')];
    yield ['tab2', Key.get('2')];
    yield ['tab3', Key.get('3')];
    yield ['tab4', Key.get('4')];
    yield ['reset', Key.get('R')];
    yield ['left', Key.get('Left')];
    yield ['right', Key.get('Right')];
    yield ['drop', Key.get('Down')];
    yield ['ccw', Key.get('Z')];
    yield ['cw', Key.get('X')];
    yield ['lock', Key.get('Space')];
    yield ['hold', Key.get('LeftShift')];
    yield ['toggle', Key.get('Enter')];
}());

const DEFAULT_HANDLING = new Handling(150, 0, 20);

export function useControls() {
    let [state, dispatch] = React.useReducer(reduce, null, init);
    return [state.keymap, state.handling, dispatch];
}

function init() {
    // TODO [#23] init from localstorage
    return {
        keymap: DEFAULT_KEYMAP,
        handling: DEFAULT_HANDLING,
    };
}

function reduce({ keymap, handling }, action) {
    switch (action.type) {
    case 'reset':
        keymap = DEFAULT_KEYMAP;
        handling = DEFAULT_HANDLING;
        break;

    case 'bind':
        if (action.payload.key) {
            keymap = keymap.set(action.payload.action, action.payload.key);
        } else {
            keymap = keymap.delete(action.payload.action);
        }
        break;

    case 'tune':
        handling = action.payload(handling);
        break;
    }

    return { keymap, handling };
}
