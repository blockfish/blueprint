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
            playfieldCell: geometry.cell.paths.map(path => ({
                transform: { tx: 0, ty: 0 },
                color: { fill: null, alpha: 1.0 },
                path,
            })),
            pieceCell: geometry.pieceCell.paths.map(path => ({
                transform: { tx: 0, ty: 0 },
                color: { fill: null, alpha: 1.0 },
                path,
            })),
            ghostCell: geometry.ghostCell.paths.map(path => ({
                transform: { tx: 0, ty: 0 },
                color: { fill: null, alpha: skin.ghost.alpha },
                path,
            })),
            queueCell: geometry.queueCell.paths.map(path => ({
                transform: { tx: 0, ty: 0 },
                color: { fill: null, alpha: 1.0 },
                path,
            })),
        };
    }

    draw(playfield, previews, hold, piece, ghost, cursor) {
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

        for (let layer = 0; layer < paths.playfieldCell.length; layer++) {
            let path = paths.playfieldCell[layer];
            for (let cell of playfield.getNonEmptyCells()) {
                path.color.fill = skin.block[cell.type][layer];
                geometry.getCellTransform(cell, path.transform);
                draw(path);
            }
        }

        if (ghost) {
            for (let layer = 0; layer < paths.ghostCell.length; layer++) {
                let path = paths.ghostCell[layer];
                path.color.fill = skin.block[ghost.type][layer];
                for (let cell of ghost.getCells()) {
                    geometry.getCellTransform(cell, path.transform);
                    draw(path);
                }
            }
        }

        if (piece) {
            for (let layer = 0; layer < paths.pieceCell.length; layer++) {
                let path = paths.pieceCell[layer];
                path.color.fill = skin.block[piece.type][layer];
                for (let cell of piece.getCells()) {
                    geometry.getCellTransform(cell, path.transform);
                    draw(path);
                }
            }
        }

        for (let layer = 0; layer < paths.queueCell.length; layer++) {
            let path = paths.queueCell[layer];
            if (hold !== null) {
                path.color.fill = skin.block[hold][layer];
                for (let t of geometry.getHoldCellTransform(hold, path.transform)) {
                    draw(path);
                }
            }
            for (let i = 0; i < previews.length; i++) {
                let type = previews[i];
                path.color.fill = skin.block[type][layer];
                for (let t of geometry.getPreviewCellTransforms(type, i, path.transform)) {
                    draw(path);
                }
            }
        }

        if (cursor) {
            let path = cursor.down ? paths.cursorDown : paths.cursorUp;
            geometry.getCellTransform(cursor.pos, path.transform);
            draw(path);
        }
    }
}
