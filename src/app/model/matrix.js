import rules from '../../data/rules'

const ROWS = rules.rows;
const COLS = rules.cols;
const TYPES = [null, 'g', 'u', ...rules.bag];

export class Matrix {
    constructor(cellArray) {
        this._cellArray = cellArray;
    }

    getCell(x, y) {
        if (x < 0 || x >= COLS || y < 0) {
            return 'u';
        }
        let cells = this._cellArray;
        let i = x + y * COLS;
        return i < cells.length ? TYPES[cells[i]] : null;
    }

    setCells(cellsIterator) {
        let cells = this._cellArray;
        let result = this;

        for (let { x, y, type } of cellsIterator) {
            let val = TYPES.indexOf(type);
            if (val < 0) {
                throw new InvalidCellTypeError(type);
            } else if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
                throw new OutOfBoundsError(x, y);
            }

            // ignore changes with no effect
            let i = x + y * COLS;
            if (cells[i] === val) {
                continue;
            }

            // lazily init the new board, that way if we aren't changing any cells then we
            // should just return `this`.
            if (result === this) {
                cells = new Uint8Array(cells);
                result = new Matrix(cells);
            }

            cells[i] = val;
        }

        return result;
    }

    *getNonEmptyCells() {
        let cells = this._cellArray;
        for (let i = 0; i < cells.length; i++) {
            let val = cells[i];
            if (val === 0) {
                continue;
            }
            let x = i % COLS;
            let y = (i - x) / COLS;
            yield { x, y, type: TYPES[val] };
        }
    }

    *getFullRows() {
        let cells = this._cellArray;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                let val = cells[x + y * COLS];
                if (val === 0) {
                    break;
                } else if (x === COLS - 1) {
                    yield y;
                }
            }
        }
    }

    clearFullRows() {
        return Matrix.fromCells(removeRows(this.getNonEmptyCells(), this.getFullRows()));
    }

    mirror() {
        return Matrix.fromCells(mirrorCells(this.getNonEmptyCells()));
    }

    lock(piece) {
        return this.setCells(piece.getCells()).clearFullRows();
    }

    equals(other) {
        for (let i = 0; i < this._cellArray.length; i++) {
            if (this._cellArray[i] !== other._cellArray[i]) {
                return false;
            }
        }
        return true;
    }
}

Matrix.EMPTY = new Matrix(new Uint8Array(ROWS * COLS));
Matrix.fromCells = cells => Matrix.EMPTY.setCells(cells);

export class InvalidCellTypeError extends Error {
    constructor(type) {
        super(`Invalid cell type ${type}`);
    }
}

export class OutOfBoundsError extends Error {
    constructor(x, y) {
        super(`Coordinate out of bounds: ${x},${y}`);
    }
}

export function* mirrorCells(cells) {
    for (let {x, y, type} of cells) {
        x = COLS - x - 1;
        switch (type) {
        case 'L': type = 'J'; break;
        case 'J': type = 'L'; break;
        case 'S': type = 'Z'; break;
        case 'Z': type = 'S'; break;
        }
        yield {x, y, type};
    }
}

// XXX(iitalics): cells must by in increasing order (left to right, bottom to top) and
// rows must be in increasing order (bottom to top).
export function* removeRows(cells, rows) {
    rows = Array.from(rows);
    rows.push(ROWS);
    rows.reverse();
    let deleteY = rows.pop();
    let dy = 0;
    for (let { x, y, type } of cells) {
        while (y > deleteY) {
            deleteY = rows.pop();
            dy++;
        }
        if (y === deleteY) {
            continue;
        }
        yield { x, y: y - dy, type };
    }
}

export function* fillRowCells(x, y, type) {
    for (let i = 0; i < COLS; i++) {
        yield { x: i, y, type: x === i ? null : type };
    }
}
