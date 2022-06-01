export class History {
    constructor(undos, redos) {
        this.undos = undos;
        this.redos = redos;
    }

    save(snapshot) {
        return new History(cons(snapshot, this.undos), null);
    }

    undo(snapshot) {
        if (!this.undos) {
            return [snapshot, this];
        }
        return [
            this.undos.snapshot,
            new History(this.undos.parent, cons(snapshot, this.redos))
        ];
    }

    redo(snapshot) {
        if (!this.redos) {
            return [snapshot, this];
        }
        return [
            this.redos.snapshot,
            new History(cons(snapshot, this.undos), this.redos.parent)
        ];
    }
}

function cons(snapshot, parent) {
    return { snapshot, parent };
}

History.EMPTY = new History(null, null);
