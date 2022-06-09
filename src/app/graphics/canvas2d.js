import skin from '../../data/skin'

export class Renderer {
    constructor(canvas, geometry) {
        this.graphics = canvas.getContext('2d');
        this.geometry = geometry;
        this.paths = {
            gridBack: {
                color: skin.grid.back,
                path: geometry.grid.back.path,
            },
            gridLines: {
                color: skin.grid.lines,
                path: geometry.grid.lines.path,
            },
            gridBorder: {
                color: skin.grid.border,
                path: geometry.grid.border.path,
            },
            cursorUp: {
                transform: { tx: 0, ty: 0 },
                color: skin.cursor.up,
                path: geometry.cursor.up.path,
            },
            cursorDown: {
                transform: { tx: 0, ty: 0 },
                color: skin.cursor.down,
                path: geometry.cursor.down.path,
            },
            cell: {
                transform: { tx: 0, ty: 0 },
                color: { fill: null, alpha: 0.0 },
                path: geometry.cell.path,
            },
            mini: {
                transform: { tx: 0, ty: 0 },
                color: { fill: null, alpha: 1.0 },
                path: geometry.mini.path,
            },
        };
    }

    draw(playfield, piece, ghost, queue, cursor) {
        let { graphics, geometry, paths } = this;

        function draw({ transform, color, path }) {
            if (transform) {
                graphics.save();
                graphics.translate(transform.tx, transform.ty);
            }
            graphics.beginPath();
            let lift = true;
            for (let pos of path) {
                if (pos === null) {
                    lift = true;
                    continue;
                }
                if (lift) {
                    graphics.moveTo(pos[0], pos[1]);
                    lift = false;
                } else {
                    graphics.lineTo(pos[0], pos[1]);
                }
            }
            graphics.fillStyle = color.fill;
            graphics.globalAlpha = color.alpha;
            graphics.fill();
            if (transform) {
                graphics.restore();
            }
        }

        graphics.globalAlpha = 1.0;
        graphics.clearRect(0, 0, geometry.width, geometry.height);

        draw(paths.gridBack);
        draw(paths.gridLines);
        draw(paths.gridBorder);

        paths.cell.color.alpha = 1.0;
        for (let cell of playfield.getNonEmptyCells()) {
            paths.cell.color.fill = skin.block[cell.type];
            geometry.getCellTransform(cell, paths.cell.transform);
            draw(paths.cell);
        }

        if (ghost) {
            paths.cell.color.alpha = 0.3;
            paths.cell.color.fill = skin.block[ghost.type];
            for (let cell of ghost.getCells()) {
                geometry.getCellTransform(cell, paths.cell.transform);
                draw(paths.cell);
            }
        }

        if (piece) {
            paths.cell.color.alpha = 1.0;
            paths.cell.color.fill = skin.block[piece.type];
            for (let cell of piece.getCells()) {
                geometry.getCellTransform(cell, paths.cell.transform);
                draw(paths.cell);
            }
        }

        if (queue.hold) {
            paths.mini.color.fill = skin.block[queue.hold];
            for (let t of geometry.getHoldCellTransform(queue.hold, paths.mini.transform)) {
                draw(paths.mini);
            }
        }
        for (let i = 0; i < queue.previews.length; i++) {
            let type = queue.previews[i];
            paths.mini.color.fill = skin.block[type];
            for (let t of geometry.getPreviewCellTransforms(type, i, paths.mini.transform)) {
                draw(paths.mini);
            }
        }

        if (cursor) {
            let path = cursor.down ? paths.cursorDown : paths.cursorUp;
            geometry.getCellTransform(cursor.pos, path.transform);
            draw(path);
        }
    }
}
