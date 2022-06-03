import rules from '../../data/rules'
import { NotImplementedError } from '../utils'

export class Piece {
    constructor(type, x, y, rotation) {
        if (x === undefined) {
            x = rules.spawn[0];
            y = rules.spawn[1];
            rotation = Rotation.NORTH;
        }
        this.type = type;
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this._cellsMemo = null;
    }

    offsetBy({ dx, dy }) {
        if (dx === 0 && dy === 0) {
            return this;
        }
        return new Piece(this.type, this.x + dx, this.y + dy, this.rotation);
    }

    rotateBy(dr) {
        if (dr === 0) {
            return this;
        }
        return new Piece(this.type, this.x, this.y, this.rotation.offset(dr));
    }

    getCells() {
        return (this._cellsMemo ||= getCells(this.type, this.rotation, this.x, this.y));
    }

    offsetIntersects(matrix, { dx, dy }) {
        // optimization: we compute getCells() less often by rolling "offsetBy" and
        // "intersects" into a single operation that checks if moving the piece would
        // intersect. this is useful since the only intersect checks we (currently) do are
        // for checking if a movement would intersect or not before actually making that
        // movement.
        for (let { x, y } of this.getCells()) {
            if (matrix.getCell(x + dx, y + dy) !== null) {
                return true;
            }
        }
        return false;
    }

    sonicDrop(matrix) {
        return Move.SONIC_DROP.apply(this, matrix) || this;
    }

    unstuck(matrix) {
        return Move.UNSTUCK.apply(this, matrix) || this;
    }
}

function getCells(type, rotation, x0, y0) {
    return rules.shapes[type].map(([dx, dy]) => {
        let [x, y] = rotation.apply(x0, y0, dx, dy);
        return {x, y, type};
    });
}

export class Rotation {
    constructor(name, t) {
        this.name = name;
        this._t = t;
        this.cw = null;
    }

    apply(x0, y0, dx, dy) {
        let t = this._t;
        let x = x0 + t[0] * dx + t[1] * dy;
        let y = y0 + t[2] * dx + t[3] * dy;
        return [x, y];
    }

    offset(dr) {
        let r = this;
        for (let i = 0; i < (dr & 3); i++) { r = r.cw; }
        return r;
    }
}

Rotation.NORTH = new Rotation('N', [1, 0, 0, 1]);
Rotation.SOUTH = new Rotation('S', [-1, 0, 0, -1]);
Rotation.EAST = new Rotation('E', [0, 1, -1, 0]);
Rotation.WEST = new Rotation('W', [0, -1, 1, 0]);

Rotation.NORTH.cw = Rotation.EAST;
Rotation.EAST.cw = Rotation.SOUTH;
Rotation.SOUTH.cw = Rotation.WEST;
Rotation.WEST.cw = Rotation.NORTH;

Rotation.fromIndex = i => Rotation.NORTH.offset(i);

/* abstract */
export class Move {
    constructor() {
        // - if true, then we should keep searching past valid locations until we find one
        //   that is invalid, then return the last valid location found
        // - if false, then we should stop searching when we find the first valid location
        this.pickLastValidOffset = false;
    }

    apply(piece, matrix) {
        piece = this._rotate(piece);
        let lastOffset = null;
        for (let offset of this._getOffsets(piece)) {
            if (piece.offsetIntersects(matrix, offset)) {
                if (this.pickLastValidOffset) {
                    break;
                }
            } else {
                lastOffset = offset;
                if (!this.pickLastValidOffset) {
                    break;
                }
            }
        }
        return lastOffset ? piece.offsetBy(lastOffset) : null;
    }

    /* virtual */
    _rotate(piece) { return piece; }
    _getOffsets(piece) { throw new NotImplementedError(); }
}

class ShiftMove extends Move {
    constructor(dx, dy) {
        super();
        this._offsets = [{ dx, dy }];
    }

    _getOffsets(piece) {
        return this._offsets;
    }
}

class ShiftRepeatMove extends Move {
    constructor(dx, dy, pickLast) {
        super();
        this.pickLastValidOffset = pickLast;
        this._dx = dx;
        this._dy = dy;
    }

    *_getOffsets(_piece) {
        let dx = 0, dy = 0;
        while (true) {
            yield { dx, dy };
            dx += this._dx;
            dy += this._dy;
        }
    }
}

class RotateMove extends Move {
    constructor(dr) {
        super();
        this._dr = dr;
        // precompute a nested mapping piecetype => rotation => applied kick test offsets.
        // note that the rotation key is the *final rotation* (after rotating the piece)
        this._kicks = new Map();
        // rules.kicks is like {"LJSTZ": ..., "O": ...}, ie. each object key contains a
        // string listing the piece types it applies to.
        for (let types of Object.keys(rules.kicks)) {
            let table = rules.kicks[types];
            let kicks = new Map();
            for (let r0 = 0; r0 < 4; r0++) {
                let r1 = (r0 + dr) & 3;
                // SRS bullshit; dx,dy = pointwise table[r0] - table[r1]
                let offsets = table[r0].map(([x0, y0], i) => {
                    let [x1, y1] = table[r1][i];
                    return { dx: x0 - x1, dy: y0 - y1 };
                });
                kicks.set(Rotation.fromIndex(r1), offsets);
            }
            // fortunately, js strings are like lists: "SZT" ~ ["S","Z","T"]
            for (let type of types) {
                this._kicks.set(type, kicks);
            }
        }
    }

    _rotate(piece) {
        return piece.rotateBy(this._dr);
    }

    _getOffsets(piece) {
        return this._kicks.get(piece.type).get(piece.rotation);
    }
}

Move.LEFT = new ShiftMove(-1, 0);
Move.RIGHT = new ShiftMove(+1, 0);
Move.DROP = new ShiftMove(0, -1);
Move.CCW = new RotateMove(-1);
Move.CW = new RotateMove(+1);

Move.SONIC_DROP = new ShiftRepeatMove(0, -1, true);
Move.UNSTUCK = new ShiftRepeatMove(0, +1, false);
Move.INF_LEFT = new ShiftRepeatMove(-1, 0, true);
Move.INF_RIGHT = new ShiftRepeatMove(+1, 0, true);
