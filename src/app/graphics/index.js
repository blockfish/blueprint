import { Matrix } from '../model/matrix'
import { Queue } from '../model/queue'
import { Geometry } from './geometry'
import * as Canvas2D from './canvas2d'

export class BoardGraphics {
    constructor() {
        this.onDragStart = undefined;
        this.onDragEnd = undefined;
        this.onDrag = undefined;

        this._playfield = Matrix.EMPTY;
        this._previews = '';
        this._hold = null;
        this._piece = null;
        this._ghost = null;
        this._cursor = { pos: null, down: false };

        this._geometry = new Geometry();
        this._canvas = null;
        this._renderer = null;
        this._repaintRequested = false;

        this._onMouseEvent = this._onMouseEvent.bind(this);
        this._onRepaint = this._onRepaint.bind(this);
    }

    setQueue(queue) {
        this._previews = queue.previews.substring(0, 9);
        this._hold = queue.hold;
        this.repaint();
    }

    setPlayfield(playfield) {
        this._playfield = playfield;
        this._ghost = null;
        this.repaint();
    }

    setPiece(piece) {
        this._piece = piece;
        this._ghost = null;
        this.repaint();
    }

    setCanvas(canvas) {
        if (this._canvas === canvas) {
            return;
        }

        if (this._canvas) {
            this._canvas.removeEventListener('mousemove', this._onMouseEvent);
            this._canvas.removeEventListener('mousedown', this._onMouseEvent);
            this._canvas.removeEventListener('mouseout', this._onMouseEvent);
            window.removeEventListener('mouseup', this._onMouseEvent);
        }

        if (!canvas) {
            this._canvas = null;
            this._renderer = null;
            return;
        }

        this._canvas = canvas;
        this._canvas.width = this._geometry.width;
        this._canvas.height = this._geometry.height;
        this._renderer = new Canvas2D.Renderer(this._canvas, this._geometry);
        this.repaint();

        this._canvas.addEventListener('mousemove', this._onMouseEvent);
        this._canvas.addEventListener('mousedown', this._onMouseEvent);
        this._canvas.addEventListener('mouseout', this._onMouseEvent);
        window.addEventListener('mouseup', this._onMouseEvent);
    }

    _onMouseEvent(evt) {
        if (!this._canvas) {
            return;
        }

        let { pos, down } = this._cursor;
        switch (evt.type) {
        case 'mousemove':
        case 'mouseout':
            {
                let boundingRect = this._canvas.getBoundingClientRect();
                let relativeX = evt.clientX - boundingRect.x;
                let relativeY = evt.clientY - boundingRect.y;
                pos = this._geometry.getCursorPos(relativeX, relativeY);
                break;
            }

        case 'mousedown':
            down = (pos !== null);
            break;

        case 'mouseup':
            down = false;
            break;
        }

        if (this._cursor.down !== down) {
            if (down) {
                this.onDragStart && this.onDragStart(pos);
            } else {
                this.onDragEnd && this.onDragEnd();
            }
            this._cursor.down = down;
            this.repaint();
        }
                
        if (!posEquals(this._cursor.pos, pos)) {
            if (pos && down) {
                this.onDrag && this.onDrag(pos);             
            }
            this._cursor.pos = pos;
            this.repaint();
        }
    }

    repaint() {
        if (!this._repaintRequested) {
            this._repaintRequested = true;
            requestAnimationFrame(this._onRepaint);
        }
    }

    _onRepaint() {
        this._repaintRequested = false;
        if (this._renderer && this._canvas) {
            this._renderer.draw(
                this._playfield,
                this._previews,
                this._hold,
                this._piece,
                this._ghost ||= this._piece?.sonicDrop(this._playfield),
                this._cursor.pos && this._cursor,
            );

            this._canvas.style.cursor = getCursorStyle(this._cursor.pos, this._cursor.down);
        }
    }
}

function posEquals(p1, p2) {
    if (p1 === null) { return p2 === null; }
    if (p2 === null) { return p1 === null; }
    return p1.x === p2.x && p1.y === p2.y;
}

function getCursorStyle(over, down) {
    if (!over) {
        return 'unset';
    }
    if (!down) {
        return 'pointer';
    }
    return 'grabbing';
}
