import { Matrix, fillRowCells } from '../model/matrix'
import { Document } from '../model/document'
import { Piece, Move } from '../model/piece'
import { Queue } from '../model/queue'

export let Flow = {};

Flow.Comment = class {};
Flow.MovePiece = class {};

Flow.Draw = class {
    constructor(palette, playfield, pos) {
        this.type = palette.color;
        this.fillRow = palette.fillRow;
        if (this.drawOn(playfield, pos) === playfield) {
            // if drawing here is redundant, then erase instead of color
            this.type = null;
        }
    }

    drawOn(playfield, pos) {
        return playfield.setCells(this._cells(pos));
    }

    _cells({ x, y }) {
        if (this.fillRow) {
            return fillRowCells(x, y, this.type);
        } else {
            return [{ x, y, type: this.type }];
        }
    }
};

export let Edit = {
    // description: string
    // apply: Document.Zipper -> Document.Zipper
    // flowType: Class?
    // initFlow: (Document.Zipper -> flowType)?
};

function pageEdit(edit) {
    return {
        ...edit,
        apply: (doc, flow) => doc.setCurrent(edit.apply(doc.current, flow))
    };
}

Edit.RESET = {
    description: 'reset all',
    apply: _doc => Document.init()
};

Edit.CREATE_PAGE = {
    description: 'create page',
    apply: doc => doc.insert(doc.current)
};

Edit.DELETE_PAGE = {
    description: 'delete page',
    apply: doc => doc.deleteCurrent()
};

Edit.CLEAR = pageEdit({
    description: 'clear playfield',
    apply(page) {
        for (let cell of page.playfield.getNonEmptyCells()) {
            // there is at least one non-empty cell, therefore we need to clear the playfield
            return page.setPlayfield(Matrix.EMPTY);
        }
        return page;
    }
});

Edit.TOGGLE_RANDOMIZER = pageEdit({
    desc: 'toggle randomizer',
    apply: page => page.setQueue(
        page.queue.setRandomizer(page.queue.randomizer ? null : Queue.BAG_RANDOMIZER)
    )
});

Edit.MIRROR = pageEdit({
    description: 'mirror playfield',
    // TODO [#28] mirror piece / queue ?
    apply(page) {
        let mirrored = page.playfield.mirror();
        return page
            .setPlayfield(mirrored)
            .setPiece(page.piece && page.piece.unstuck(mirrored));
    }
});

Edit.draw = (palette, pos) => pageEdit({
    description: 'draw blocks',
    flowType: Flow.Draw,
    initFlow: doc => new Flow.Draw(palette, doc.current.playfield, pos),
    apply(page, flow) {
        let playfield = flow.drawOn(page.playfield, pos);
        if (playfield === page.playfield) {
            return page;
        }
        return page
            .setPlayfield(playfield)
            .setPiece(page.piece && page.piece.unstuck(playfield));
    }
});

Edit.queue = queue => pageEdit({
    desc: 'change page comment',
    // TODO [#11] flow for changing the queue
    apply: page => page.setQueue(queue)
});

Edit.comment = text => pageEdit({
    desc: 'change page comment',
    flowType: Flow.Comment,
    initFlow: _doc => new Flow.Comment(),
    apply: page => page.setComment(text)
});

Edit.movePiece = move => pageEdit({
    desc: 'move piece',
    flowType: Flow.MovePiece,
    initFlow: _doc => new Flow.MovePiece(),
    apply(page) {
        let piece = page.piece && move.apply(page.piece, page.playfield);
        if (piece === null) {
            return page;
        }
        return page.setPiece(piece);
    }
});

Edit.HOLD = pageEdit({
    desc: 'hold',
    apply(page) {
        if (page.queue.isEmpty) {
            return page;
        }
        let [newType, newQueue] = page.queue.swapHold(page.piece && page.piece.type);
        return page
            .setPiece(newType && new Piece(newType))
            .setQueue(newQueue);
    }
});

Edit.TOGGLE_PIECE = pageEdit({
    desc: 'toggle piece',
    apply(page) {
        if (page.piece === null) {
            if (page.queue.isEmpty) {
                return page;
            }
            return page.spawnPiece();
        } else {
            return page
                .setQueue(page.queue.pushFront(page.piece.type))
                .setPiece(null);
        }
    }
});

Edit.LOCK_PIECE = {
    desc: 'place piece',
    apply(doc) {
        let page = doc.current;
        if (page.piece === null) {
            return doc;
        }
        let piece = page.piece.sonicDrop(page.playfield);
        return doc.setCurrent(page.setPiece(piece)).insert(
            page
                .setPlayfield(
                    page.playfield
                        .setCells(piece.getCells())
                        .clearFullRows()
                )
                .spawnPiece()
        );
    },
};
