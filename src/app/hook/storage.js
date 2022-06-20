import { useDelay } from '../hook/utils'
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
