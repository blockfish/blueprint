import { Database } from '../storage/db'

export function useLocalStorageDatabase() {
    let ref = React.useRef(null);
    let db = ref.current;
    if (!db) {
        db = ref.current = new Database();
        try {
            db.restore(window.localStorage);
        } catch (e) {
            console.error('Error loading from storage:', e);
        }
    }
    db.onChange = useDelay(100, () => {
        try {
            db.save(window.localStorage);
        } catch (e) {
            console.error('Error saving to storage:', e);
        }
    });
    return db;
}

// returns a function that acts like 'func', but has 'delay' ms delay, and if the function
// is called again before the delay is over, then the previous call is cancelled.
function useDelay(delay, func) {
    let tm = React.useRef(null);
    React.useEffect(() => () => clearTimeout(tm.current), [tm]);
    return (...args) => {
        clearTimeout(tm.current);
        tm.current = setTimeout(() => {
            tm.current = null;
            func(...args);
        }, delay);
    };
}
