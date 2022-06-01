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

    unzip(index) {
        if (index < 0 || index >= this.pages.length) {
            throw new Error(`Index out of bounds: ${index}`);
        }
        let current = this.pages[index];
        let prevs = null;
        for (let i = 0; i < index; i++) {
            prevs = { page: this.pages[i], prev: prevs };
        }
        let nexts = null;
        for (let i = this.pages.length - 1; i > index; i--) {
            nexts = { page: this.pages[i], next: nexts };
        }
        return new Zipper(index, this.count, current, prevs, nexts);
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
    return new Document([ initialPage ]).unzip(0);
};
