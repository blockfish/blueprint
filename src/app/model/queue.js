import rules from '../../data/rules'
import { PRNG } from '../model/prng'

export class Queue {
    constructor(previews, hold, randomizer) {
        if (randomizer) {
            let next;
            while (previews.length < rules.previews) {
                [next, randomizer] = randomizer.gen();
                previews += next;
            }
        }
        this.previews = previews;
        this.hold = hold;
        this.randomizer = randomizer;
    }

    get isEmpty() {
        return this.previews.length === 0 && this.hold === null;
    }

    setRandomizer(rand) {
        return new Queue(this.previews, this.hold, rand);
    }

    pushFront(type) {
        return new Queue(type + this.previews, this.hold, this.randomizer);
    }

    popFront() {
        if (this.previews.length === 0) {
            return [this.hold, Queue.EMPTY];
        }
        return [
            this.previews[0],
            new Queue(this.previews.substring(1), this.hold, this.randomizer)
        ];
    }

    swapHoldCurrent(current) {
        let top = this.previews[0] || null;
        let rest = this.previews.substring(1);
        let hold = this.hold;
        if (!current) {
            [hold, current, top] = [top, current, hold];
        } else if (!hold) {
            [hold, current, top] = [current, top, hold];
        } else {
            [hold, current, top] = [current, hold, top];
        }
        return [current, new Queue(top ? (top + rest) : rest, hold, this.randomizer)];
    }

    toString() {
        return `[${this.hold || ''}]${this.previews}`;
    }
}

Queue.EMPTY = new Queue('', null, null);

Queue.parse = str => {
    let match = /^(?:\[([LOJSTZI]?)\])?([LOJSTZI]*)$/.exec(str.toUpperCase());
    if (!match) {
        throw new InvalidQueueStringError(str);
    }
    return new Queue(match[2], match[1] || null, null);
}

export class InvalidQueueStringError extends Error {
    constructor(str) {
        super(`Invalid queue: "${str}"`);
        this.inputString = str;
    }
}

const BAG = rules.bag;

export class BagRandomizer {
    constructor(prng, idx, bag = null) {
        if (idx >= BAG.length) {
            // shuffle just to reseed the PRNG, then request a new bag via below condition
            prng = prng.shuffle(new Array(BAG.length));
            bag = null;
            idx = 0;
        }
        if (bag == null) {
            // XXX(iitalics): intentionally don't store the post-shuffle PRNG inside;
            // `this.bag` is only a form of memoization. the PRNG will be reseeded *after*
            // reaching the end of the bag.
            let order = Array.from(BAG);
            prng.shuffle(order);
            bag = order.join('');
        }
        this.prng = prng;
        this.idx = idx;
        this.bag = bag;
    }

    gen() {
        let { prng, idx, bag } = this;
        return [bag[idx], new BagRandomizer(prng, idx + 1, bag)];
    }
}

BagRandomizer.init = () => new BagRandomizer(new PRNG(), BAG.length);
