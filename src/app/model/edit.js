import { Matrix, fillRowCells } from '../model/matrix'
import { Document } from '../model/document'
import { Piece } from '../model/piece'
import { Queue, BagRandomizer } from '../model/queue'

export let Flow = {};

Flow.Comment = class {};

Flow.Move = class {};

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

Edit.importDoc = newDoc => ({
    description: 'import from code',
    apply: _doc => newDoc
});

Edit.RESET = {
    description: 'reset all',
    apply: _doc => Document.init().unzip(),
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
        page.queue.setRandomizer(page.queue.randomizer ? null : BagRandomizer.init())
    )
});

Edit.MIRROR = pageEdit({
    description: 'mirror playfield',
    // TODO [#9] mirror the pieces/queue
    apply(page) {
        let mirrored = page.playfield.mirror();
        return page
            .setPlayfield(mirrored)
            .setPiece(page.piece && page.piece.unstuck(mirrored));
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
    // TODO [#10] may need to add a new 'flow' for queue modifications
    apply: page => page.setQueue(queue)
});

Edit.comment = text => pageEdit({
    desc: 'change page comment',
    flowType: Flow.Comment,
    initFlow: _doc => new Flow.Comment(),
    apply: page => page.setComment(text)
});

Edit.piece = (piece, queue) => pageEdit({
    desc: 'change current piece',
    flowType: Flow.Move,
    initFlow: _doc => new Flow.Move(),
    apply: page => page.setPiece(piece).setQueue(queue)
});

Edit.lock = (lockPiece, piece, queue, playfield) => ({
    desc: 'lock in piece',
    apply: doc => doc
        .setCurrent(doc.current.setPiece(lockPiece))
        .insert(
            doc.current
                .setPiece(piece)
                .setQueue(queue)
                .setPlayfield(playfield)
        )
});

