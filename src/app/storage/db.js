import * as V1 from './v1'

const VER_KEY = 'bp::ver';
const V1_USER_KEY = 'bp::v1::user';

export class Database {
    constructor() {
        this._map = new Map;
        this.onChange = null;
    }

    load(key) {
        return this._map.get(key) || null;
    }

    store(key, val) {
        if (!equals(this._map.get(key), val)) {
            this._map.set(key, val);
            this.onChange && this.onChange(key);
        }
    }

    save(storage) {
        let { user } = V1.save(this._map);
        storage.setItem(VER_KEY, 'corrupt/1');
        storage.setItem(V1_USER_KEY, user);
        if (storage.getItem(V1_USER_KEY) !== user) {
            throw new Error(`saving failed: user data: ${user}`);
        }
        storage.setItem(VER_KEY, '1');
    }

    restore(storage) {
        let ver = storage.getItem(VER_KEY);
        switch (ver) {
        case null:
            this._map.clear();
            break;

        case '1':
            this._map = V1.restore({ user: storage.getItem(V1_USER_KEY) });
            break;

        default:
            throw new Error(`bad storage found: version '${ver}'`);
        }
    }
}

function equals(x, y) {
    if (x == null || y == null) {
        return x == null && y == null;
    }
    if (typeof x !== 'object') {
        return x === y;
    }
    return x.equals(y);
}
