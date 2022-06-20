import { Document } from '../model/document'
import { Page } from '../model/page'
import { Queue, BagRandomizer } from '../model/queue'
import { PRNG } from '../model/prng'
import { Piece, Rotation } from '../model/piece'
import { Matrix } from '../model/matrix'
import { NotImplementedError } from '../utils'
import { encodeVarint, decodeVarint, fromRunLengths, toRunLengths } from './utils'

import FROM_ASCII from '../../data/v1-text-from-ascii.bin'
import TO_ASCII from '../../data/v1-text-to-ascii.bin'

/* entry point: bitcode encoding/decoding */

// decode(reader: BitReader) -> Iterator[Op]
export function* decode(reader) {
    let opcodes = new Map();
    for (let key in Op) {
        let OpType = Op[key];
        if (OpType instanceof Function && OpType.prototype instanceof Op) {
            opcodes.set(OpType.opcode, OpType);
        }
    }

    const END = 15;
    function end() { return END; }

    for (let opcode; (opcode = reader.read(4, end)) !== END; ) {
        let OpType = opcodes.get(opcode);
        if (!OpType) {
            throw new Error(`Invalid opcode: ${opcode}`);
        }
        yield new OpType(...OpType.fields.map(f => f.decode(reader)));
    }
}

// encode(writer: BitWriter, ops: Iterator[Op])
export function encode(writer, ops) {
    for (let op of ops) {
        let OpType = op.constructor;
        writer.write(OpType.opcode, 4);
        for (let i = 0; i < op.fields.length; i++) {
            OpType.fields[i].encode(writer, op.fields[i]);
        }
    }
    while (writer.totalBits % 8 !== 0) {
        // XXX(iitalics): fill the final byte with 1's. if these bits happen to be decoded
        // as an opcode, they will be 0xf = 15 = "END" opcode.
        writer.write(1);
    }
    writer.end();
}

/* common encoders/decoders */

const PIECE_TYPE = {
    decode(reader) {
        switch (reader.read(3)) {
        case 1: return 'I';
        case 2: return 'J';
        case 3: return 'L';
        case 4: return 'O';
        case 5: return 'S';
        case 6: return 'T';
        case 7: return 'Z';
        case 0: throw new Error(`Invalid piece type encoding`);
        }
    },
    encode(writer, type) {
        switch (type) {
        case 'I': writer.write(1, 3); break;
        case 'J': writer.write(2, 3); break;
        case 'L': writer.write(3, 3); break;
        case 'O': writer.write(4, 3); break;
        case 'S': writer.write(5, 3); break;
        case 'T': writer.write(6, 3); break;
        case 'Z': writer.write(7, 3); break;
        }
    },
};

const LOCATION = {
    decode(reader) {
        let rotation = Rotation.fromIndex(reader.read(2));
        let xy = decodeVarint(reader);
        let x = xy % 10;
        let y = (xy - x) / 10;
        return [ x, y, rotation ];
    },
    encode(writer, [ x, y, rotation ]) {
        writer.write(rotation.toIndex(), 2);
        encodeVarint(writer, x + 10 * y);
    },
};

function absoluteToRelativeY(matrix, type, rotation, x, y) {
    let piece = new Piece(type, x, 0, rotation).unstuck(matrix);
    let ry = 0;
    while (piece.y < y) {
        piece = piece.offsetBy({ dy: 1 }).unstuck(matrix);
        ry++;
    }
    return ry;
}

function relativeToAbsoluteY(matrix, type, rotation, x, ry) {
    let piece = new Piece(type, x, 0, rotation).unstuck(matrix);
    for (let i = 0; i < ry; i++) {
        piece = piece.offsetBy({ dy: 1 }).unstuck(matrix);
    }
    return piece.y;
}

const CELL_TYPE = {
    decode(reader) {
        if (reader.read()) {
            return 'g';
        }
        switch (reader.read(3)) {
        case 1: return 'I';
        case 2: return 'J';
        case 3: return 'L';
        case 4: return 'O';
        case 5: return 'S';
        case 6: return 'T';
        case 7: return 'Z';
        case 0: return null;
        }
    },
    encode(writer, type) {
        if (type === 'g') {
            writer.write(1);
            return;
        }
        writer.write(0);
        switch (type) {
        case 'I': writer.write(1, 3); break;
        case 'J': writer.write(2, 3); break;
        case 'L': writer.write(3, 3); break;
        case 'O': writer.write(4, 3); break;
        case 'S': writer.write(5, 3); break;
        case 'T': writer.write(6, 3); break;
        case 'Z': writer.write(7, 3); break;
        case null: writer.write(0, 3); break;
        }
    },
};

const COORDS = {
    decode(reader) {
        let runLengths = new Array(decodeVarint(reader) + 1);
        for (let i = 0; i < runLengths.length; i++) {
            runLengths[i] = decodeVarint(reader) + (i > 0 ? 1 : 0);
        }
        let idxs = Array.from(fromRunLengths(runLengths));
        return idxs.map(idx => {
            let x = idx % 10;
            let y = (idx - x) / 10;
            return [x, y];
        });
    },
    encode(writer, coords) {
        let idxs = coords.map(([x, y]) => x + y * 10).sort((i, j) => i - j);
        let runLengths = Array.from(toRunLengths(idxs));
        if (runLengths.length === 0) {
            return;
        }
        encodeVarint(writer, runLengths.length - 1);
        for (let i = 0; i < runLengths.length; i++) {
            encodeVarint(writer, runLengths[i] - (i > 0 ? 1 : 0));
        }
    },
}

const TEXT = {
    decode(reader) {
        let charCodes = [];
        for (let code; (code = decodeVarint(reader)) != 0; ) {
            charCodes.push(code < 128 ? TO_ASCII[code] : code);
        }
        return String.fromCharCode(...charCodes);
    },
    encode(writer, text) {
        for (let i = 0; i < text.length; i++) {
            let code = text.charCodeAt(i);
            encodeVarint(writer, code < 128 ? FROM_ASCII[code] : code);
        }
        encodeVarint(writer, 0);
    },
};

const BAG_RANDOMIZER = {
    decode(reader) {
        let s = new Int32Array(2);
        s[0] = reader.read(32);
        s[1] = reader.read(32);
        let idx = reader.read(3);
        return new BagRandomizer(new PRNG(s), idx);
    },
    encode(writer, rand) {
        writer.write(rand.prng.s[0], 32);
        writer.write(rand.prng.s[1], 32);
        writer.write(rand.idx, 3);
    },
};

function randomizerEqual(r1, r2) {
    if (r1 === null) { return r2 === null; }
    if (r2 === null) { return r1 === null; }
    let s1 = new Uint32Array(r1.prng.s);
    let s2 = new Uint32Array(r2.prng.s);
    return s1[0] === s2[0] && s1[1] === s2[1] && r1.idx === r2.idx;
}

/* bitcode operations */

class Op {
    constructor(...fields) { this.fields = fields; }
    exec(_doc) { throw new NotImplementedError(); }
}

Op.InsertPage = class extends Op {
    static opcode = 8;
    static fields = [];
    exec(sim) {
        sim.insertPage(sim.page);
    }
};

Op.PushBack = class extends Op {
    static opcode = 0;
    static fields = [ PIECE_TYPE ];
    get type() { return this.fields[0]; }
    exec(sim) { sim.queue = sim.queue.pushBack(this.type); }
};

Op.PushFront = class extends Op {
    static opcode = 1;
    static fields = [ PIECE_TYPE ];
    get type() { return this.fields[0]; }
    exec(sim) { sim.queue = sim.queue.pushFront(this.type); }
};

Op.PopFront = class extends Op {
    static opcode = 2;
    static fields = [];
    exec(sim) { sim.queue = sim.queue.popFront()[1]; }
};

Op.SwapHold = class extends Op {
    static opcode = 3;
    static fields = [];
    exec(sim) { sim.queue = sim.queue.swapHold(); }
};

Op.UnsetHold = class extends Op {
    static opcode = 10;
    static fields = [];
    exec(sim) { sim.queue = sim.queue.setHold(null); }
};

Op.SetBagRandomizer = class extends Op {
    static opcode = 11;
    static fields = [ BAG_RANDOMIZER ];
    get randomizer() { return this.fields[0]; }
    exec(sim) { sim.queue = sim.queue.setRandomizer(this.randomizer); }
};

Op.UnsetRandomizer = class extends Op {
    static opcode = 12;
    static fields = [];
    exec(sim) { sim.queue = sim.queue.setRandomizer(null); }
};

Op.SetPieceLocation = class extends Op {
    static opcode = 4;
    static fields = [ LOCATION ];
    get location() { return this.fields[0]; }
    exec(sim) {
        let type = sim.piece?.type;
        if (!type) {
            let [front, back] = sim.queue.popFront();
            if (!front) {
                throw new Error('Trying to spawn piece with empty queue');
            }
            type = front;
            sim.queue = back;
        }
        let [ x, ry, rotation ] = this.location;
        let y = relativeToAbsoluteY(sim.playfield, type, rotation, x, ry);
        sim.piece = new Piece(type, x, y, rotation);
    }
};

Op.UnsetPiece = class extends Op {
    static opcode = 9;
    static fields = [];
    exec(sim) { sim.piece = null; }
};

Op.Fill = class extends Op {
    static opcode = 6;
    static fields = [ CELL_TYPE, COORDS ];
    get type() { return this.fields[0]; }
    get coords() { return this.fields[1]; }
    exec(sim) {
        sim.playfield = sim.playfield.setCells(
            this.coords.map(([x, y]) => ({ x, y, type: this.type }))
        );
    }
};

Op.Lock = class extends Op {
    static opcode = 5;
    static fields = [];
    exec(sim) {
        let piece = sim.piece;
        if (!piece) {
            throw new Error('Trying to lock with no active piece');
        }
        sim.insertPage(sim.page);
        sim.playfield = sim.playfield.lock(piece);
        sim.piece = null;
    }
};

Op.SetComment = class extends Op {
    static opcode = 7;
    static fields = [ TEXT ];
    get comment() { return this.fields[0]; }
    exec(sim) {
        sim.page = sim.page.setComment(this.comment);
    }
};

/* bitcode compile, execute */

// compile(doc: Document) -> Iterator[Op]
export function* compile(doc) {
    let currentPlayfield = null;
    let currentQueue = Queue.EMPTY;
    let currentPiece = null;
    let currentComment = '';

    for (let page of doc.pages) {
        if (currentPlayfield && currentPiece
            && currentPlayfield.lock(currentPiece).equals(page.playfield))
        {
            yield new Op.Lock();
            currentPiece = null;
        } else {
            if (currentPlayfield !== null) {
                yield new Op.InsertPage();
            }
            yield* compileMatrix(page.playfield, currentPlayfield || Matrix.EMPTY);
        }
        currentPlayfield = page.playfield;

        if (page.queue.hold !== currentQueue.hold) {
            let swapped = currentQueue.swapHold(), target = page.queue.hold;
            if (swapped.hold === target) {
                yield new Op.SwapHold();
                currentQueue = swapped;
            } else {
                if (currentQueue.hold) {
                    yield new Op.UnsetHold();
                }
                if (target) {
                    yield new Op.PushFront(target);
                    yield new Op.SwapHold();
                }
                currentQueue = currentQueue.setHold(target);
            }
        }

        if (page.piece) {
            let { type, x, y, rotation } = page.piece;
            if (currentPiece?.type !== type) {
                if (currentPiece) {
                    yield new Op.UnsetPiece();
                }
                let [front, rest] = currentQueue.popFront();
                if (front === type) {
                    currentQueue = rest;
                } else {
                    // push the desired piece type onto the front; it gets immediately popped
                    // and used for the piece
                    yield new Op.PushFront(type);
                }
            }
            let ry = absoluteToRelativeY(currentPlayfield, type, rotation, x, y);
            yield new Op.SetPieceLocation([ x, ry, rotation ]);
        } else if (currentPiece) {
            yield new Op.UnsetPiece();
        }
        currentPiece = page.piece;

        while (!page.queue.previews.startsWith(currentQueue.previews)) {
            if (currentQueue.randomizer) {
                // XXX(iitalics): if we ever find ourselves messing with the previews,
                // then the randomizer is no longer reliable and we need to turn it off.
                yield new Op.UnsetRandomizer();
                currentQueue = currentQueue.setRandomizer(null);
            }
            yield new Op.PopFront();
            currentQueue = currentQueue.popFront()[1];
        }
        for (let i = currentQueue.previews.length; i < page.queue.previews.length; i++) {
            yield new Op.PushBack(page.queue.previews[i]);
            currentQueue = currentQueue.pushBack(page.queue.previews[i]);
        }

        if (!randomizerEqual(page.queue.randomizer, currentQueue.randomizer)) {
            if (page.queue.randomizer instanceof BagRandomizer) {
                yield new Op.SetBagRandomizer(page.queue.randomizer);
                currentQueue = currentQueue.setRandomizer(page.queue.randomizer);
            } else {
                yield new Op.UnsetRandomizer();
                currentQueue = currentQueue.setRandomizer(null);
            }
        }

        if (currentComment !== page.comment) {
            yield new Op.SetComment(page.comment);
            currentComment = page.comment;
        }
    }
}

function* compileMatrix(matrix, oldMatrix) {
    let blocks = new Map();
    for (let { x, y, type } of diffMatrix(oldMatrix, matrix)) {
        let coords = blocks.get(type) || [];
        blocks.set(type, coords);
        coords.push([ x, y ]);
    }
    for (let [type, coords] of blocks) {
        yield new Op.Fill(type, coords);
    }
}

function* diffMatrix(before, after) {
    // all cells that have changed color
    for (let cell of after.getNonEmptyCells()) {
        if (before.getCell(cell.x, cell.y) !== cell.type) {
            yield cell;
        }
    }
    // all cells that need to be erased
    for (let cell of before.getNonEmptyCells()) {
        if (after.getCell(cell.x, cell.y) === null) {
            cell.type = null;
            yield cell;
        }
    }
}

// execute(ops: Iterator[Op]) -> Document
export function execute(ops) {
    let sim = new Simulator();
    for (let op of ops) {
        op.exec(sim);
    }
    return sim.finish();
}

class Simulator {
    constructor() {
        this.doc = new Document([ Page.EMPTY ]).unzip();
    }

    get page() { return this.doc.current; }
    set page(x) { this.doc = this.doc.setCurrent(x); }
    get queue() { return this.page.queue; }
    set queue(x) { this.page = this.page.setQueue(x); }
    get piece() { return this.page.piece; }
    set piece(x) { this.page = this.page.setPiece(x); }
    get playfield() { return this.page.playfield; }
    set playfield(x) { this.page = this.page.setPlayfield(x); }

    insertPage(p) {
        this.doc = this.doc.insert(p);
    }

    finish() {
        return this.doc.zip();
    }
}
