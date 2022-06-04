import { Page } from '../model/page'
import { Queue } from '../model/queue'

export class Document {
    constructor(pages) {
        if (pages.length < 1) {
            throw new Error('invalid to have no pages');
        }
        this.pages = pages;
    }

    get count() { return this.pages.length; }

    unzip() {
        // build linked list from array
        let head = { page: this.pages[0], next: null }, tail = head;
        for (let i = 1; i < this.pages.length; i++) {
            tail.next = { page: this.pages[i], next: null };
            tail = tail.next;
        }
        return new Zipper(0, this.count, head.page, null, head.next);
    }
}

class Zipper {
    constructor(index, count, current, prevs, nexts) {
        this.index = index;
        this.count = count;
        this.current = current;
        this.prevs = prevs;
        this.nexts = nexts;
    }

    zip() {
        let pages = [];
        let prevs = this.prevs;
        while (prevs !== null) {
            pages.push(prevs.page);
            prevs = prevs.prev;
        }
        pages.reverse();
        pages.push(this.current);
        let nexts = this.nexts;
        while (nexts !== null) {
            pages.push(nexts.page);
            nexts = nexts.next;
        }
        return new Document(pages);
    }

    next() {
        if (this.nexts === null) {
            return this;
        }
        return new Zipper(
            this.index + 1,
            this.count,
            this.nexts.page,
            { page: this.current, prev: this.prevs },
            this.nexts.next,
        );
    }

    prev() {
        if (this.prevs === null) {
            return this;
        }
        return new Zipper(
            this.index - 1,
            this.count,
            this.prevs.page,
            this.prevs.prev,
            { page: this.current, next: this.nexts },
        );
    }

    setCurrent(newPage) {
        if (this.current === newPage) {
            return this;
        }
        return new Zipper(this.index, this.count, newPage, this.prevs, this.nexts);
    }

    insert(newPage) {
        return new Zipper(
            this.index + 1,
            this.count + 1,
            newPage,
            { page: this.current, prev: this.prevs },
            this.nexts,
        );
    }

    deleteCurrent() {
        if (this.nexts !== null) {
            // delete current and replace with next
            return new Zipper(
                this.index,
                this.count - 1,
                this.nexts.page,
                this.prevs,
                this.nexts.next,
            );
        }
        if (this.prevs !== null) {
            // delete current and replace with prev
            return new Zipper(
                this.index - 1,
                this.count - 1,
                this.prevs.page,
                this.prevs.prev,
                null,
            );
        }
        // this is the only page so do nothing
        return this;
    }

    deleteAllAfter() {
        if (this.nexts === null) {
            return this;
        }
        return new Zipper(this.index, this.index + 1, this.current, this.prevs, null);
    }
}

Document.Zipper = Zipper;

Document.init = () => {
    let initialPage = Page.EMPTY
        .setQueue(Queue.EMPTY.setRandomizer(Queue.BAG_RANDOMIZER))
        .spawnPiece();
    return new Document([ initialPage ]).unzip();
};
