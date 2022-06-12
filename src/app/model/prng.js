// this PRNG implements xoroshiro64** 1.0, adapted from:
//
//     https://prng.di.unimi.it/xoroshiro64starstar.c
//
// credit David Blackman and Sebastiano Vigna

export class PRNG {
    constructor(s) {
        this.s = s || new Int32Array([
            Math.random() * 4294967295,
            Math.random() * 4294967295,
        ]);
    }

    shuffle(array) {
        let s = new Int32Array(this.s);
        // XXX(iitalics): shift PRNG results by this much so that we use as little bits as
        // possible, hopefully reducing the number of retries needed.
        let shr = Math.clz32(array.length - 1);
        for (let i = array.length - 1; i > 0; i--) {
            // pick random j, 0 <= j <= i
            let j = i + 1;
            while (j > i) {
                j = xoroshiro64ss(s) >>> shr;
                // retry RNG if j is too large
            }
            swap(array, i, j);
        }
        return new PRNG(s);
    }

    /* (unused) */
    // nextInt(range = 0) {
    //     if (range <= 0) { throw new RangeError(); }
    //     let mask = (1 << 32 - Math.clz32(range)) - 1;
    //     let s = new Int32Array(this.s);
    //     while (true) {
    //         let result = xoshiro128(s) & mask;
    //         if (result < range) {
    //             return [result, new PRNG(s)];
    //         }
    //     }
    // }
}

function xoroshiro64ss(s) {
    let s0 = s[0], s1 = s[1];
    let result = Math.imul(rotl(Math.imul(s0, 0x9e3779bb), 5), 5);
    s1 ^= s0;
    s[0] = rotl(s0, 26) ^ s1 ^ (s1 << 9);
    s[1] = rotl(s1, 13);
    return result;
}

function rotl(x, k) {
    return (x << k) | (x >>> (32 - k));
}

function swap(array, i, j) {
    let tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
}
