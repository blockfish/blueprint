export class Handling {
    constructor(das, arr, sdr) {
        this.das = das;
        this.arr = arr;
        this.sdr = sdr;
    }

    setDAS(das) { return new Handling(das, this.arr, this.sdr); }
    setARR(arr) { return new Handling(this.das, arr, this.sdr); }
    setSDR(sdr) { return new Handling(this.das, this.arr, sdr); }

    equals(other) {
        return eq(this.das, other.das)
            && eq(this.arr, other.arr)
            && eq(this.sdr, other.sdr);
    }
}

function eq(x, y) {
    return Math.abs(x - y) <= 0.01;
}
