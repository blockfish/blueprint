import rules from '../../data/rules'

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

    swapHold(current) {
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

class BagRandomizer {
    constructor(bag = '') {
        this.bag = bag.length > 0 ? bag : Array.from(rules.bag);
    }

    gen() {
        let bag = Array.from(this.bag);
        // TODO [#32] should replace Math.random() with simple PRNG
        let idx = Math.floor(Math.random() * bag.length);
        let [next] = bag.splice(idx, 1);
        return [next, new BagRandomizer(bag)];
    }
}

Queue.BAG_RANDOMIZER = new BagRandomizer();
