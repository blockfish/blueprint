import { Document } from '../model/document'
import { Page } from '../model/page'
import { Queue } from '../model/queue'
import { NotImplementedError } from '../utils'
import { encodeVarint, decodeVarint } from './utils'

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

/* bitcode compile, execute */

// compile(doc: Document) -> Iterator[Op]
export function* compile(doc) {
    let currentPlayfield = null;
    let currentQueue = Queue.EMPTY;

    for (let page of doc.pages) {
        if (currentPlayfield !== null) {
            yield new Op.InsertPage();
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

        while (!page.queue.previews.startsWith(currentQueue.previews)) {
            yield new Op.PopFront();
            currentQueue = currentQueue.popFront()[1];
        }
        for (let i = currentQueue.previews.length; i < page.queue.previews.length; i++) {
            yield new Op.PushBack(page.queue.previews[i]);
            currentQueue = currentQueue.pushBack(page.queue.previews[i]);
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

    insertPage(p) {
        this.doc = this.doc.insert(p);
    }

    finish() {
        return this.doc.zip();
    }
}
