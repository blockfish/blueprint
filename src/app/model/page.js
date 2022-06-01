import { Matrix } from '../model/matrix'
import { Queue } from '../model/queue'
import { Piece } from '../model/piece'

export class Page {
    constructor(playfield, queue, piece, comment) {
        this.playfield = playfield;
        this.queue = queue;
        this.piece = piece;
        this.comment = comment;
    }

    setPlayfield(playfield) { return new Page(playfield, this.queue, this.piece, this.comment); }
    setQueue(queue) { return new Page(this.playfield, queue, this.piece, this.comment); }
    setPiece(piece) { return new Page(this.playfield, this.queue, piece, this.comment); }
    setComment(comment) { return new Page(this.playfield, this.queue, this.piece, comment); }

    spawnPiece() {
        let [front, back] = this.queue.popFront();
        return new Page(
            this.playfield,
            back,
            front && new Piece(front),
            this.comment,
        );
    }
}

Page.EMPTY = new Page(Matrix.EMPTY, Queue.EMPTY, null, '');
