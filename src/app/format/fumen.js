import { decode } from 'tetris-fumen/lib/decoder'
import { Document } from '../model/document'
import { Page } from '../model/page'
import { Matrix } from '../model/matrix'
import { Queue } from '../model/queue'
import { Piece, Rotation } from '../model/piece'

export function decodeFumen(data) {
    let fumenPages = decode(data);

    let pages = [];
    for (let i = 0; i < fumenPages.length; i++) {
        let { flags, field, operation, comment } = fumenPages[i];
        let playfield = fumenFieldToMatrix(field);
        let piece = fumenOperationToPiece(operation);
        let queue, current;
        if (flags.quiz && comment.startsWith('#Q=')) {
            [current, queue] = fumenQuizToQueue(comment);
            if (!piece) {
                queue = current ? queue.pushFront(current) : queue;
            } else if (piece?.type != current) {
                [current, queue] = queue.swapHoldCurrent(current);
                if (current !== piece.type) {
                    throw new Error(`expected piece ${piece.type} not at front of queue`);
                }
            }
            comment = '';
        } else {
            queue = accumulateQueueFromPages(fumenPages, i + 1);
        }
        pages.push(new Page(playfield, queue, piece, comment));
    }

    return new Document(pages);
}

function fumenFieldToMatrix(field) {
    return Matrix.fromCells(function*() {
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 20; y++) {
                let type = field.at(x, y);
                if (type === 'X') {
                    type = 'g';
                }
                if (type !== '_') {
                    yield { x, y, type };
                }
            }
        }
    }());
}

function fumenOperationToPiece(op) {
    if (!op) {
        return null;
    }
    let { type, x, y, rotation } = op;
    switch (rotation) {
    case 'spawn': rotation = Rotation.NORTH; break;
    case 'right': rotation = Rotation.EAST; break;
    case 'reverse': rotation = Rotation.SOUTH; break;
    case 'left': rotation = Rotation.WEST; break;
    }
    return new Piece(type, x, y, rotation);
}

function fumenQuizToQueue(comment) {
    let match = /^#Q=\[([LOJSTZI]?)\]?\(([LOJSTZI]?)\)([LOJSTZI]*)$/.exec(comment);
    let hold = match[1] || null;
    let current = match[2] || null;
    let previews = match[3];
    return [current, new Queue(previews, hold, null)];
}

function accumulateQueueFromPages(fumenPages, startIndex) {
    let previews = [];
    for (let i = startIndex; i < fumenPages.length; i++) {
        if (previews.length >= 5) {
            break;
        }
        let type = fumenPages[i].operation?.type;
        if (type) {
            previews.push(type);
        }
    }
    return new Queue(previews.join(''), null, null);
}
