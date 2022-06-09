import { Handling } from './model/handling'
import { Matrix } from './model/matrix'
import { Queue } from './model/queue'
import { Piece, Move } from './model/piece'

export class Stacker {
    constructor() {
        this.onMove = undefined;
        this.onHold = undefined;
        this.onLock = undefined;

        this.handling = new Handling(0, 0, 0);
        this.playfield = Matrix.EMPTY;
        this.queue = Queue.EMPTY;
        this.piece = null;

        this._actionQueue = [];
        this._autoshift = null;
        this._softdrop = null;
        this._ticker = null;
    }

    start() {
        this.stop();
        this._ticker = setInterval(this.tick.bind(this), 0);
    }

    stop() {
        if (this._ticker !== null) {
            clearInterval(this._ticker);
            this._ticker = null;
        }
    }

    tick() {
        let time = performance.now();

        let execute = (action, repeats) => {
            switch (action) {
            case 'lock': return this._lock();
            case 'hold': return this._swapHold();
            case 'ccw': return this._move(Move.CCW);
            case 'cw': return this._move(Move.CW);
            case 'flip': return this._move(Move.FLIP);
            case 'drop': return this._move(repeats ? Move.SONIC_DROP : Move.DROP);
            case 'left': return this._move(repeats ? Move.INF_LEFT : Move.LEFT);
            case 'right': return this._move(repeats ? Move.INF_RIGHT : Move.RIGHT);
            default: return false;
            }
        };

        // execute all queued actions in order
        for (let action of this._actionQueue) {
            execute(action);
        }
        this._actionQueue.length = 0;

        // handle autoshift triggers
        if (this._autoshift !== null) {
            while (time > this._autoshift.deadline) {
                if (this.handling.arr === 0) {
                    execute(this._autoshift.dir, true);
                    break;
                } else {
                    execute(this._autoshift.dir, false);
                    this._autoshift.deadline += this.handling.arr;
                }
            }
        }

        // handle softdrop triggers
        if (this._softdrop !== null) {
            while (time > this._softdrop.deadline) {
                if (this.handling.sdr === 0) {
                    execute('drop', true);
                    break;
                } else {
                    execute('drop', false);
                    this._softdrop.deadline += this.handling.sdr;
                }
            }
        }
    }

    _enqueue(action) {
        this._actionQueue.push(action);
    }

    _move(move) {
        if (!this.piece) {
            return false;
        }
        let resultPiece = move.apply(this.piece, this.playfield);
        if (!resultPiece) {
            return false;
        }
        this.piece = resultPiece;
        this.onMove && this.onMove(move);
        return true;
    }

    _swapHold() {
        let [pieceType, resultQueue] = this.queue.swapHold(this.piece?.type || null);
        let resultPiece = pieceType ? new Piece(pieceType) : null;
        this.queue = resultQueue;
        this.piece = resultPiece;
        this.onHold && this.onHold();
        return true;
    }

    _lock() {
        if (!this.piece) {
            return false;
        }
        let droppedPiece = this.piece.sonicDrop(this.playfield);
        let [front, back] = this.queue.popFront();
        this.piece = front ? new Piece(front) : null;
        this.queue = back;
        this.playfield = this.playfield.lock(droppedPiece);
        this.onLock && this.onLock(droppedPiece);
        return true;
    }

    dispatchAction(action) {
        let time = performance.now();

        switch (action) {
        case 'lock': case 'hold':
        case 'ccw': case 'cw': case 'flip':
            this._enqueue(action);
            break;

        case 'drop':
            this._softdrop = { deadline: time };
            break;

        case 'left':
        case 'right':
            {
                let dir = action;
                this._enqueue(action);
                this._autoshift = { dir, deadline: time + this.handling.das };
                break;
            }

        case 'left:up':
        case 'right:up':
            {
                let dir = action.substring(0, action.indexOf(':'));
                if (this._autoshift?.dir === dir) {
                    this._autoshift = null;
                }
                break;
            }

        case 'drop:up':
            this._softdrop = null;
            break;
        }
    }
}
