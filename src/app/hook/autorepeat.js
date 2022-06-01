export function useAutorepeat(cd, rd, callback) {
    let arRef = React.useRef(null);
    let ar = (arRef.current ||= new Autorepeater());

    React.useEffect(() => {
        return () => ar.destroy();
    }, [ar]);

    ar.chargeDelay = cd;
    ar.repeatDelay = rd;
    ar.onFire = callback;
    return ar;
}

class Autorepeater {
    constructor() {
        this.chargeDelay = 0;
        this.repeatDelay = 0;
        this.onFire = null;
        this._charging = null;
        this._chargingAlt = null;
        this._timeout = null;
        this._interval = null;
        this._trigger = this._trigger.bind(this);
    }

    _clearTimers() {
        if (this._timeout !== null) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }
        if (this._interval !== null) {
            clearInterval(this._interval);
            this._interval = null;
        }
    }

    // actionAlt is used for the special case when repeatDelay=0, which may have different
    // behavior to simulate "infinite repeats" every trigger, e.g. immediate DAS to wall,
    // or sonic drop to ground.
    charge(action, actionAlt = action) {
        this._clearTimers();
        this._charging = action;
        this._chargingAlt = actionAlt;
        this._timeout = setTimeout(this._trigger, this.chargeDelay);
    }

    release(action) {
        if (this._charging === action) {
            this._clearTimers();
        }
    }

    _trigger() {
        if (this._interval === null) {
            this._clearTimers();
            this._interval = setInterval(this._trigger, Math.max(1, this.repeatDelay));
        }
        let action = this.repeatDelay === 0 ? this._chargingAlt : this._charging;
        this.onFire && this.onFire(action);
    }

    destroy() {
        this._clearTimers();
        this._charging = null;
        this._onFire = null;
    }
}
