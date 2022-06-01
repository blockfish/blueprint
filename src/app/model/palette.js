export class Palette {
    constructor(color, fillRow) {
        this.color = color;
        this.fillRow = fillRow;
    }

    setColor(color) { return new Palette(color, this.fillRow); }
    setFillRow(fillRow) { return new Palette(this.color, fillRow); }
}
