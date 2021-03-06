import rules from '../../data/rules'

const H_MARGIN = 24;
const V_MARGIN = 16;
const PADDING = 16;

const CELL = 30;
const MINI_CELL = 24;

// XXX(iitalics): 'visible' dimensions, not dimensions according to the ruleset
const ROWS = 20;
const COLS = 10;

const QUEUE_PIECE_ROWS = 2;
const QUEUE_PIECE_COLS = 4;
const QUEUE_SPACING = 20;

export class Geometry {
    constructor() {

        this.hold = {};
        this.hold.x = H_MARGIN + QUEUE_PIECE_COLS * MINI_CELL / 2;
        this.hold.y = V_MARGIN + QUEUE_PIECE_ROWS * MINI_CELL / 2;
        this.hold.right = this.hold.x + QUEUE_PIECE_COLS * MINI_CELL / 2;

        this.playfield = {};
        this.playfield.x = this.hold.right + PADDING;
        this.playfield.y = V_MARGIN;
        this.playfield.width = CELL * COLS;
        this.playfield.height = CELL * ROWS;
        this.playfield.right = this.playfield.x + this.playfield.width;
        this.playfield.bottom = this.playfield.y + this.playfield.height;

        this.previews = {};
        this.previews.x = QUEUE_PIECE_COLS * MINI_CELL / 2;
        this.previews.x += this.playfield.right + PADDING;
        this.previews.y = V_MARGIN + QUEUE_PIECE_ROWS * MINI_CELL / 2;
        this.previews.right = this.previews.x + QUEUE_PIECE_COLS * MINI_CELL / 2;

        this.grid = {
            back: { path: Array.from(gridBackPath(this.playfield, CELL)) },
            lines: { path: Array.from(gridLinesPath(this.playfield, 1, CELL)) },
            border: { path: Array.from(rectOuterCupPath(this.playfield, 2)) },
        };

        this.cell = { paths: [
            Array.from(blockSkinPathL0(CELL)),
            Array.from(blockSkinPathL1(CELL)),
            Array.from(blockSkinPathL2(CELL)),
        ] };
        this.pieceCell = { paths: [ Array.from(blockSkinPathL0(CELL)) ] };
        this.ghostCell = { paths: [ Array.from(ghostSkinPath(CELL)) ] };
        this.queueCell = { paths: [ Array.from(blockSkinPathL0(MINI_CELL)) ] };

        this.cursor = {
            up: { path: Array.from(cursorSkinPath(CELL, false)) },
            down: { path: Array.from(cursorSkinPath(CELL, true)) },
        };

        this.width = this.previews.right + H_MARGIN;
        this.height = this.playfield.bottom + V_MARGIN;

        this.centeredPieceOffset = new Map();
        for (let type in rules.shapes) {
            let minX = 4, maxX = -4, minY = 4, maxY = -4;
            for (let [x, y] of rules.shapes[type]) {
                minX = Math.min(x, minX);
                maxX = Math.max(x, maxX);
                minY = Math.min(y, minY);
                maxY = Math.max(y, maxY);
            }
            let dx = -(maxX + minX + 1) / 2;
            let dy = -(maxY + minY) / 2;
            this.centeredPieceOffset.set(type, [dx, dy]);
        }
    }

    getCursorPos(mouseX, mouseY) {
        let x = (mouseX - this.playfield.x) / CELL;
        let y = (this.playfield.bottom - mouseY) / CELL;
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
            return null;
        }
        return {
            x: Math.floor(x),
            y: Math.floor(y),
        };
    }

    getCellTransform({ x, y }, dst = {tx:0,ty:0}) {
        dst.tx = this.playfield.x + x * CELL;
        dst.ty = this.playfield.bottom - (y + 1) * CELL;
        return dst;
    }

    *getHoldCellTransform(type, dst = {tx:0,ty:0}) {
        let [dx, dy] = this.centeredPieceOffset.get(type);
        for (let [x, y] of rules.shapes[type]) {
            dst.tx = this.hold.x + (x + dx) * MINI_CELL;
            dst.ty = this.hold.y - (y + dy) * MINI_CELL;
            yield dst;
        }
    }

    *getPreviewCellTransforms(type, index, dst = {tx:0,ty:0}) {
        let [dx, dy] = this.centeredPieceOffset.get(type);
        for (let [x, y] of rules.shapes[type]) {
            dst.tx = this.previews.x + (x + dx) * MINI_CELL;
            dst.ty = this.previews.y - (y + dy) * MINI_CELL;
            dst.ty += (QUEUE_PIECE_ROWS * MINI_CELL + QUEUE_SPACING) * index;
            yield dst;
        }
    }
}

function* rectFillPath(rect) {
    let { x, y, width, height } = rect;
    let x0 = x, x1 = x + width, y0 = y, y1 = y + height;
    yield [x0, y0];
    yield [x1, y0];
    yield [x1, y1];
    yield [x0, y1];
}

function* rectInnerOutlinePath(rect, lineWidth) {
    let { x, y, width, height } = rect;
    let x0 = x, x1 = x + lineWidth, x2 = x + width - lineWidth, x3 = x + width;
    let y0 = y, y1 = y + lineWidth, y2 = y + height - lineWidth, y3 = y + height;
    yield [x0, y0];
    yield [x3, y0];
    yield [x3, y3];
    yield [x0, y3];
    yield [x0, y1];
    yield [x1, y1];
    yield [x1, y2];
    yield [x2, y2];
    yield [x2, y1];
    yield [x0, y1];
}

function* rectOuterCupPath(rect, lineWidth) {
    let { x, y, width, height } = rect;
    let x0 = x - lineWidth, x1 = x, x2 = x + width, x3 = x + width + lineWidth;
    let y0 = y, y1 = y + height, y2 = y + height + lineWidth;
    yield [x0, y0];
    yield [x0, y2];
    yield [x3, y2];
    yield [x3, y0];
    yield [x2, y0];
    yield [x2, y1];
    yield [x1, y1];
    yield [x1, y0];
}

function* gridBackPath(rect, cellSize) {
    yield* rectFillPath(rect);
    /* checkerboard: */
    // for (let i = 0; i < COLS; i++) {
    //     for (let j = 0; j < ROWS; j++) {
    //         if ((i + j) % 2 === 0) {
    //             continue;
    //         }
    //         yield* rectFillPath({
    //             x: rect.x + i * cellSize,
    //             y: rect.y + j * cellSize,
    //             width: cellSize,
    //             height: cellSize,
    //         });
    //         yield null;
    //     }
    // }
}

function* gridLinesPath(rect, lineWidth, cellSize) {
    for (let i = 1; i < COLS; i++) {
        yield* rectFillPath({
            x: rect.x + i * cellSize,
            y: rect.y,
            width: lineWidth,
            height: rect.height,
        });
        yield null;
    }
    for (let i = 1; i < ROWS; i++) {
        yield* rectFillPath({
            x: rect.x,
            y: rect.y + i * cellSize,
            width: rect.width,
            height: lineWidth,
        });
        yield null;
    }
}

function* blockSkinPathL0(cellSize) {
    // base color
    yield* rectFillPath({ x: 0, y: 0, width: cellSize, height: cellSize });
}

function* blockSkinPathL1(cellSize) {
    // lighter
    let x0 = 0, x1 = cellSize / 2, x2 = cellSize;
    let y0 = 0, y1 = cellSize / 2;
    yield [x0, y0];
    yield [x2, y0];
    yield [x1, y1];
}

function* blockSkinPathL2(cellSize) {
    // darker
    let x0 = 0, x1 = cellSize / 2, x2 = cellSize;
    let y0 = cellSize / 2, y1 = cellSize;
    yield [x0, y1];
    yield [x2, y1];
    yield [x1, y0];
}

function* ghostSkinPath(cellSize) {
    yield* rectInnerOutlinePath({ x: 2, y: 2, width: cellSize - 3, height: cellSize - 3 }, 2);
}

function* cursorSkinPath(cellSize, down) {
    yield* rectInnerOutlinePath({ x: 0, y: 0, width: cellSize, height: cellSize }, down ? 3 : 1);
}
