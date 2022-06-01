import RULES from '../data/rules'
import SKIN from '../data/skin'
import { Matrix } from './model/matrix'

// XXX(iitalics): these represent 'visible' dimensions, not dimensions according to the
// ruleset. not sure if there should be some sort of configuration for this or not
const ROWS = 20;
const COLS = 10;
const PREVIEWS = 5;
const QUEUE_PIECE_ROWS = 2;
const QUEUE_PIECE_COLS = 4;

const GEOMETRY = {
    cell: 30,
    margin: { top: 16, left: 16, right: 16, bottom: 16 },
    grid: { lineWidth: 1 },
    hud: { lineWidth: 3 },
    queue: { padding: 15, spacing: 30 },
    cursor: {
        up: { lineWidth: 1 },
        down: { lineWidth: 5 },
    },
};

let CENTERED_PIECE_COORDS = {};
for (let type in RULES.shapes) {
    let minX = 4, maxX = -4, minY = 4, maxY = -4;
    for (let [x, y] of RULES.shapes[type]) {
        minX = Math.min(x, minX);
        maxX = Math.max(x, maxX);
        minY = Math.min(y, minY);
        maxY = Math.max(y, maxY);
    }
    let dx = (QUEUE_PIECE_COLS - maxX - minX - 1) / 2;
    let dy = (QUEUE_PIECE_ROWS - maxY - minY - 1) / 2;
    CENTERED_PIECE_COORDS[type] = RULES.shapes[type].map(([x, y]) => [x + dx, y + dy]);
}

function getComputedGeometry() {
    let lw = GEOMETRY.hud.lineWidth;
    let hlw = GEOMETRY.hud.lineWidth / 2;

    let hold = {};
    hold.x0 = GEOMETRY.margin.left + lw;
    hold.x1 = hold.x0
        + QUEUE_PIECE_COLS * GEOMETRY.cell
        + 2 * GEOMETRY.queue.padding;
    hold.y0 = GEOMETRY.margin.top + lw;
    hold.y1 = hold.y0
        + QUEUE_PIECE_ROWS * GEOMETRY.cell
        + 2 * GEOMETRY.queue.padding;

    let matrix = {};
    matrix.x0 = hold.x1 + lw;
    matrix.x1 = matrix.x0 + COLS * GEOMETRY.cell;
    matrix.y0 = GEOMETRY.margin.top;
    matrix.y1 = matrix.y0 + ROWS * GEOMETRY.cell;

    let previews = {};
    previews.x0 = matrix.x1 + lw;
    previews.x1 = previews.x0
        + QUEUE_PIECE_COLS * GEOMETRY.cell
        + 2 * GEOMETRY.queue.padding;
    previews.y0 = hold.y0;
    previews.y1 = previews.y0
        + PREVIEWS * QUEUE_PIECE_ROWS * GEOMETRY.cell
        + (PREVIEWS - 1) * GEOMETRY.queue.spacing
        + 2 * GEOMETRY.queue.padding;

    let canvas = {};
    canvas.width = previews.x1 + lw + GEOMETRY.margin.right;
    canvas.height = matrix.y1 + lw + GEOMETRY.margin.bottom;

    return { hold, matrix, previews, canvas };
}

function computeCursorLocation(absX, absY) {
    let geom = getComputedGeometry();
    let x = (absX - geom.matrix.x0) / GEOMETRY.cell;
    let y = (absY - geom.matrix.y0) / GEOMETRY.cell;
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
        return null;
    }
    return {
        x: Math.floor(x),
        y: Math.ceil(ROWS - y - 1),
    };
}

function drawHUD(g) {
    let geom = getComputedGeometry();
    let hudLW = GEOMETRY.hud.lineWidth;
    let gridLW = GEOMETRY.grid.lineWidth;

    g.fillStyle = SKIN.hud.back.fill;
    g.globalAlpha = SKIN.hud.back.alpha;
    g.fillRect(
        geom.hold.x0,
        geom.hold.y0,
        geom.hold.x1 - geom.hold.x0,
        geom.hold.y1 - geom.hold.y0,
    );
    g.fillRect(
        geom.previews.x0,
        geom.previews.y0,
        geom.previews.x1 - geom.previews.x0,
        geom.previews.y1 - geom.previews.y0,
    );

    g.fillStyle = SKIN.grid.back.fill;
    g.globalAlpha = SKIN.grid.back.alpha;
    g.fillRect(
        geom.matrix.x0,
        geom.matrix.y0,
        geom.matrix.x1 - geom.matrix.x0,
        geom.matrix.y1 - geom.matrix.y0,
    );

    g.strokeStyle = SKIN.grid.outline.fill;
    g.globalAlpha = SKIN.grid.outline.alpha;
    g.lineWidth = gridLW;
    g.beginPath();
    g.save();
    g.translate(geom.matrix.x0, geom.matrix.y0);
    for (let x = 1; x < COLS; x++) {
        g.moveTo(GEOMETRY.cell * x + gridLW / 2, 0);
        g.lineTo(GEOMETRY.cell * x + gridLW / 2, GEOMETRY.cell * ROWS);
    }
    for (let y = 1; y < ROWS; y++) {
        g.moveTo(0, GEOMETRY.cell * y + gridLW / 2);
        g.lineTo(GEOMETRY.cell * COLS, GEOMETRY.cell * y + gridLW / 2);
    }
    g.stroke();
    g.restore();

    g.strokeStyle = SKIN.hud.outline.fill;
    g.globalAlpha = SKIN.hud.outline.alpha;
    g.lineWidth = GEOMETRY.hud.lineWidth;
    g.beginPath();
    g.rect(
        geom.hold.x0 - hudLW / 2,
        geom.hold.y0 - hudLW / 2,
        geom.hold.x1 - geom.hold.x0 + hudLW,
        geom.hold.y1 - geom.hold.y0 + hudLW,
    );
    g.rect(
        geom.previews.x0 - hudLW / 2,
        geom.previews.y0 - hudLW / 2,
        geom.previews.x1 - geom.previews.x0 + hudLW,
        geom.previews.y1 - geom.previews.y0 + hudLW,
    );
    g.moveTo(geom.matrix.x0 - hudLW / 2, geom.matrix.y0);
    g.lineTo(geom.matrix.x0 - hudLW / 2, geom.matrix.y1 + hudLW / 2);
    g.lineTo(geom.matrix.x1 + hudLW / 2, geom.matrix.y1 + hudLW / 2);
    g.lineTo(geom.matrix.x1 + hudLW / 2, geom.matrix.y0);
    g.stroke();
}

function drawCells(g, cells, alpha) {
    let geom = getComputedGeometry();
    g.globalAlpha = alpha;
    for (let { x, y, type } of cells) {
        g.fillStyle = SKIN.block[type].fill;
        g.fillRect(
            geom.matrix.x0 + GEOMETRY.cell * x,
            geom.matrix.y0 + GEOMETRY.cell * (ROWS - y - 1),
            GEOMETRY.cell,
            GEOMETRY.cell,
        );
    }
}

function drawMatrix(g, matrix) {
    drawCells(g, matrix.getNonEmptyCells(), 1);
}

function drawPiece(g, piece, ghost) {
    drawCells(g, piece.getCells(), ghost ? 0.3 : 1);
}

function drawQueue(g, which, pieces) {
    let geom = getComputedGeometry();
    let { x0, y0 } = geom[which];
    x0 += GEOMETRY.queue.padding;
    y0 += GEOMETRY.queue.padding + (QUEUE_PIECE_ROWS - 1) * GEOMETRY.cell;
    g.globalAlpha = 1;
    for (let type of pieces) {
        g.fillStyle = SKIN.block[type].fill;
        g.beginPath();
        for (let [x, y] of CENTERED_PIECE_COORDS[type]) {
            g.rect(
                x0 + GEOMETRY.cell * x, 
                y0 - GEOMETRY.cell * y,
                GEOMETRY.cell,
                GEOMETRY.cell,
            );
        }
        g.fill();
        y0 += QUEUE_PIECE_ROWS * GEOMETRY.cell + GEOMETRY.queue.spacing;
    }
}

function drawCursor(g, cur) {
    if (cur.pos !== null) {
        let geom = getComputedGeometry();
        let updown = cur.dragging ? 'down' : 'up';
        let curLW = GEOMETRY.cursor[updown].lineWidth;
        g.strokeStyle = SKIN.cursor[updown].fill;
        g.globalAlpha = SKIN.cursor[updown].alpha;
        g.lineWidth = curLW;
        g.strokeRect(
            geom.matrix.x0 + GEOMETRY.cell * cur.pos.x + curLW / 2,
            geom.matrix.y0 + GEOMETRY.cell * (ROWS - cur.pos.y - 1) + curLW / 2,
            GEOMETRY.cell - curLW,
            GEOMETRY.cell - curLW,
        );
    }

    g.canvas.style.cursor =
        cur.dragging ? 'grabbing' :
        cur.pos ? 'pointer' :
        'unset';
}

export class BoardRenderer {
    constructor() {
        this.onDragStart = undefined;
        this.onDragEnd = undefined;
        this.onDrag = undefined;

        this._canvas = null;
        this._graphics = null;
        this._repaintRequested = false;

        this._matrix = Matrix.EMPTY;
        this._hold = '';
        this._previews = '';
        this._piece = null;
        this._ghost = null;
        this._cursor = {pos: null, dragging: false};

        this._onMouseEvent = this._onMouseEvent.bind(this);
        this._onRepaint = this._onRepaint.bind(this);
    }

    setHold(hold) {
        hold = hold || '';
        if (hold !== this._hold) {
            this._hold = hold;
            this.repaint();
        }
    }

    setPreviews(previews) {
        if (!previews) {
            previews = '';
        } else if (typeof previews !== 'string') {
            previews = Array.from(previews).join('');
        }
        if (previews !== this._previews) {
            this._previews = previews;
            this.repaint();
        }
    }

    setMatrix(mat) {
        if (mat !== this._matrix) {
            this._matrix = mat;
            this._ghost = null;
            this.repaint();
        }
    }

    setPiece(piece) {
        if (piece !== this._piece) {
            this._piece = piece;
            this._ghost = null;
            this.repaint();
        }
    }

    setCanvas(canvas) {
        if (this._canvas) {
            this._canvas.removeEventListener('mousemove', this._onMouseEvent);
            this._canvas.removeEventListener('mousedown', this._onMouseEvent);
            this._canvas.removeEventListener('mouseout', this._onMouseEvent);
            window.removeEventListener('mouseup', this._onMouseEvent);
        }

        if (!canvas) {
            this._canvas = this._graphics = null;
            return;
        }

        canvas.addEventListener('mousemove', this._onMouseEvent);
        canvas.addEventListener('mousedown', this._onMouseEvent);
        canvas.addEventListener('mouseout', this._onMouseEvent);
        window.addEventListener('mouseup', this._onMouseEvent);

        let geom = getComputedGeometry();
        canvas.width = geom.canvas.width;
        canvas.height = geom.canvas.height;

        this._canvas = canvas;
        this._graphics = canvas.getContext('2d');
        this._repaintRequested = false;
        this.repaint();
    }

    _onMouseEvent(evt) {
        if (!this._canvas) {
            return;
        }

        let {pos, dragging} = this._cursor;
        switch (evt.type) {
        case 'mousemove':
        case 'mouseout':
            {
                let br = this._canvas.getBoundingClientRect();
                pos = computeCursorLocation(evt.clientX - br.x, evt.clientY - br.y);
                break;
            }
        case 'mousedown':
            dragging = (pos !== null);
            break;
        case 'mouseup':
            dragging = false;
            break;
        }

        if (dragging !== this._cursor.dragging) {
            this._cursor.dragging = dragging;
            if (dragging) {
                this.onDragStart && this.onDragStart(pos);
            } else {
                this.onDragEnd && this.onDragEnd();
            }
            this.repaint();
        }

        function posEqual(p1, p2) {
            if (p1 === null) { return p2 === null; }
            if (p2 === null) { return p1 === null; }
            return p1.x === p2.x && p1.y === p2.y;
        }

        if (!posEqual(pos, this._cursor.pos)) {
            this._cursor.pos = pos;
            if (pos && dragging) {
                this.onDrag && this.onDrag(pos);             
            }
            this.repaint();
        }
    }

    repaint() {
        if (this._repaintRequested) {
            return;
        }
        this._repaintRequested = true;
        requestAnimationFrame(this._onRepaint);
    }

    _onRepaint() {
        this._repaintRequested = false;
        if (!this._graphics) {
            return;
        }

        this._graphics.clearRect(0, 0, this._canvas.width, this._canvas.height);
        drawHUD(this._graphics, 5);
        drawMatrix(this._graphics, this._matrix);
        if (this._piece) {
            let ghost = (this._ghost ||= this._piece.sonicDrop(this._matrix));
            drawPiece(this._graphics, ghost, true);
            drawPiece(this._graphics, this._piece, false);
        }
        drawQueue(this._graphics, 'hold', this._hold);
        drawQueue(this._graphics, 'previews', this._previews);
        drawCursor(this._graphics, this._cursor);
    }
}
