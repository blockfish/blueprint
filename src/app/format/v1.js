import { Document } from '../model/document'
import { Page } from '../model/page'
import { NotImplementedError } from '../utils'

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

/* bitcode compile, execute */

// compile(doc: Document) -> Iterator[Op]
export function* compile(doc) {
    let currentPlayfield = null;

    for (let page of doc.pages) {
        if (currentPlayfield !== null) {
            yield new Op.InsertPage();
        }
        currentPlayfield = page.playfield;
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

    insertPage(p) {
        this.doc = this.doc.insert(p);
    }

    finish() {
        return this.doc.zip();
    }
}
