import { Key } from '../model/keymap'

export function useGlobalKeyboard(_keymap, _callback) {
    // combine keymap and callback into one ref so that we don't have to rebind the
    // keyboard events on every change
    let dispatchRef = React.useRef(null);
    dispatchRef.current = [_keymap, _callback];

    React.useEffect(() => {
        // XXX(iitalics): `keyEv.repeat` is not consistent across browsers :( so we
        // have to track it ourselves via this map.
        let trackRepeats = new Set();

        function onKey(keyEv) {
            let key = Key.fromKeyEvent(keyEv);
            let up = keyEv.type === 'keyup';
            if (!key) {
                return;
            }

            if (up) {
                trackRepeats.delete(key);
            } else {
                if (trackRepeats.has(key)) {
                    return;
                }
                trackRepeats.add(key);
            }

            let [keymap, callback] = dispatchRef.current;
            let action = keymap.getAction(key);
            if (action !== null) {
                callback(up ? `${action}:up` : action);
                keyEv.preventDefault();
            }
        }

        document.body.addEventListener('keydown', onKey);
        document.body.addEventListener('keyup', onKey);
        return () => {
            document.body.removeEventListener('keydown', onKey);
            document.body.removeEventListener('keyup', onKey);
        };
    }, [dispatchRef]);
}

