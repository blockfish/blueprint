import keynames from '../../data/keynames'

export class Key {
    constructor(name, noCtrl) {
        if (Key.ALL.has(name)) {
            throw new Error(`Reinstantiated key "${name}"`);
        }
        Key.ALL.set(name, this);

        this.name = name;
        if (noCtrl) {
            this.ctrl = this;
            this.noCtrl = noCtrl;
        } else {
            this.ctrl = new Key(`Ctrl-${name}`, this);
            this.noCtrl = this;
        }
    }

    get isCtrl() { return this.ctrl === this; }
    toString() { return this.name; }
}

Key.ALL = new Map();
Key.get = name => Key.ALL.get(name) || new Key(name, null);

let keyByCode = new Map();
for (let [name, code] of keynames) {
    keyByCode.set(code, Key.get(name));
}

Key.fromKeyEvent = keyEv => {
    let key = keyByCode.get(keyEv.code);
    if (!key) {
        return null;
    }
    return keyEv.ctrlKey ? key.ctrl : key;
};

export class Keymap {
    constructor(bindings) {
        this._keyToAct = new Map();
        this._actToKey = new Map();
        for (let [act, key] of bindings) {
            if (this._keyToAct.has(key)) {
                this._actToKey.delete(this._keyToAct.get(key));
            }
            if (this._actToKey.has(act)) {
                this._keyToAct.delete(this._actToKey.get(act));
            }
            this._keyToAct.set(key, act);
            this._actToKey.set(act, key);
        }
    }

    getAction(key) { return this._keyToAct.get(key) || null; }
    getBinding(action) { return this._actToKey.get(action) || null; }

    set(action, key) {
        return new Keymap(addBinding(this._actToKey, action, key));
    }

    delete(action) {
        return new Keymap(deleteBinding(this._actToKey, action));
    }

    equals(other) {
        return subset(this._actToKey, other._actToKey)
            && subset(other._actToKey, this._actToKey);
    }
}

function* addBinding(bindings, action, key) {
    yield* bindings;
    yield [action, key];
}

function* deleteBinding(bindings, action) {
    for (let pair of bindings) {
        if (pair[0] !== action) {
            yield pair;
        }
    }
}

function subset(lhs, rhs) {
    for (let [k, v] of lhs) {
        if (rhs.get(k) !== v) {
            return false;
        }
    }
    return true;
}
