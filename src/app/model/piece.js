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

    offsetBy({ dx, dy, dr }) {
        dx = (dx || 0);
        dy = (dy || 0);
        dr = (dr || 0) & 3;
        if (dx === 0 && dy === 0 && dr === 0) {
            return this;
        }
        return new Piece(this.type, this.x + dx, this.y + dy, this.rotation.rotate(dr));
    }

    *getKicks(dr) {
        for (let [dx, dy] of this.rotation.getKicks(this.type, dr)) {
            yield { dx, dy, dr };
        }
    }

    getCells() {
        return (this._cellsMemo ||= getPieceCells(this.type, this.rotation, this.x, this.y));
    }

    intersects(matrix) {
        for (let { x, y } of this.getCells()) {
            if (matrix.getCell(x, y) !== null) {
                return true;
            }
        }
        return false;
    }

    sonicDrop(matrix) {
        return Move.SONIC_DROP.apply(this, matrix) || this;
    }

    unstuck(matrix) {
        let unstuck = this;
        while (unstuck.intersects(matrix)) {
            unstuck = unstuck.offsetBy({ dy: 1 });
        }
        return unstuck;
    }
}

function getPieceCells(type, rotation, x0, y0) {
    let [xx, xy, yx, yy] = rotation.transform;
    return rules.shapes[type].map(([dx, dy]) => {
        let x = x0 + xx * dx + xy * dy;
        let y = y0 + yx * dx + yy * dy;
        return { x, y, type };
    });
}

export class Rotation {
    constructor(name, transform) {
        this.name = name;
        this.transform = transform;
        this.cw = null;
    }

    rotate(dr) {
        let r = this;
        for (let i = 0; i < (dr & 3); i++) {
            r = r.cw;
        }
        return r;
    }

    getKicks(pieceType, dr) {
        let { cw, ccw, flip } = rules.kicks[pieceType][this.name];
        switch (dr & 3) {
        case 0: return [];
        case 1: return cw;
        case 2: return flip;
        case 3: return ccw;
        }
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

Rotation.fromIndex = i => Rotation.NORTH.rotate(i);

/* abstract */
export class Move {
    constructor(pickLastValid) {
        // - if true, then we should keep searching past valid locations until we find one
        //   that is invalid, then return the last valid location found
        // - if false, then we should stop searching when we find the first valid location
        this._pickLastValid = pickLastValid;
    }

    apply(piece, matrix) {
        let validPiece = null;
        for (let offset of this._getOffsets(piece)) {
            let resultPiece = piece.offsetBy(offset);
            if (resultPiece.intersects(matrix, offset)) {
                if (this._pickLastValid) {
                    break;
                }
            } else {
                validPiece = resultPiece;
                if (!this._pickLastValid) {
                    break;
                }
            }
        }
        return validPiece;
    }

    /* virtual */
    _getOffsets(piece) { throw new NotImplementedError(); }
}

class ShiftMove extends Move {
    constructor(dx, dy) {
        super(false);
        this._offsets = [{ dx, dy }];
    }

    _getOffsets(piece) {
        return this._offsets;
    }
}

class ShiftRepeatMove extends Move {
    constructor(dx, dy) {
        super(true);
        this._dx = dx;
        this._dy = dy;
    }

    *_getOffsets(_piece) {
        let dx = 0, dy = 0;
        while (true) {
            dx += this._dx;
            dy += this._dy;
            yield { dx, dy };
        }
    }
}

class RotateMove extends Move {
    constructor(dr) {
        super(false);
        this._dr = dr;
    }

    _getOffsets(piece) {
        return piece.getKicks(this._dr);
    }
}

Move.LEFT = new ShiftMove(-1, 0);
Move.RIGHT = new ShiftMove(+1, 0);
Move.DROP = new ShiftMove(0, -1);
Move.CCW = new RotateMove(-1);
Move.CW = new RotateMove(+1);
Move.FLIP = new RotateMove(+2);
Move.SONIC_DROP = new ShiftRepeatMove(0, -1);
Move.INF_LEFT = new ShiftRepeatMove(-1, 0);
Move.INF_RIGHT = new ShiftRepeatMove(+1, 0);
