export class EndOfStreamError extends Error {
    constructor() { super('Stream ended unexpectedly'); }
}

export function throwEndOfStreamError() {
    throw new EndOfStreamError();
}

export class BitReader {
    constructor(stream) {
        this._stream = stream;
        this._buf = 0;
        this._bufSize = 0;
    }

    read(count = 1, eos = throwEndOfStreamError) {
        let buf = this._buf, bufSize = this._bufSize;

        while (bufSize < count) {
            let [ele, eleSize] = this._stream.next();
            if (!eleSize) {
                this._buf = buf;
                this._bufSize = bufSize;
                return eos(buf, bufSize, count);
            }

            // XXX(iitalics): this special case is necessary to prevent buf from ever
            // overflowing 32 bits, assuming count,eleSize <= 32
            if (bufSize + eleSize >= count) {
                // [---buf---] [------ele------]
                //             [--rem--] [-ovr-]
                // [------count--------]
                let rem = count - bufSize;
                let ovr = eleSize - rem;
                this._buf = ele & ((1 << ovr) - 1);
                this._bufSize = ovr;
                return ((buf << rem) | (ele >>> ovr)) >>> 0;
            }

            buf = (buf << eleSize) | ele;
            bufSize += eleSize;
        }

        // [----------buf----------]
        // [-----count-----] [-ovr-]
        let ovr = bufSize - count;
        this._buf = buf & ((1 << ovr) - 1);
        this._bufSize = ovr;
        return buf >>> ovr;
    }
}

export class BitWriter {
    constructor(sink) {
        this._sink = sink;
        this._buf = 0;
        this._bufSize = 0;
        this.totalBits = 0;
    }

    write(ele, eleSize = 1) {
        let buf = this._buf, bufSize = this._bufSize;
        let maxSize = this._sink.maxBitsPerElem;

        // XXX(iitalics): this special case is necessary to prevent buf from ever
        // overflowing 32 bits, assuming maxSize,eleSize <= 32
        if (bufSize + eleSize >= maxSize) {
            // [---buf---] [------ele------]
            //             [-rem-] [--ovr--]
            // [-------max-------]
            let rem = maxSize - bufSize;
            let ovr = eleSize - rem;
            this._sink.push(((buf << rem) | (ele >>> ovr)) >>> 0);
            buf = ele & ((1 << ovr) - 1);
            bufSize = ovr;
        } else {
            buf = (buf << eleSize) | ele;
            bufSize += eleSize;
        }

        while (bufSize >= maxSize) {
            // [-----------buf-----------]
            // [-------max-------] [-ovr-]
            let ovr = bufSize - maxSize;
            this._sink.push(buf >>> ovr);
            buf &= (1 << ovr) - 1;
            bufSize = ovr;
        }

        this._buf = buf;
        this._bufSize = bufSize;
        this.totalBits += eleSize;
    }

    end() {
        this._sink.end(this._buf, this._bufSize);
    }
}

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const FROM_BASE64 = new Int8Array(128);
const TO_BASE64 = new Int8Array(64);
for (let i = 0; i < 128; i++) { FROM_BASE64[i] = -1; }
for (let i = 0; i < 64; i++) {
    FROM_BASE64[BASE64.charCodeAt(i)] = i;
    TO_BASE64[i] = BASE64.charCodeAt(i);
}

export class InvalidBase64Error extends Error {
    constructor() { super('Malformed base64 string'); }
}

export class Base64Stream {
    constructor(str, start = 0, end = str.length) {
        let padding = 0;
        switch ((end - start) % 4) {
            // handle weird lengths by assuming specific padding
        case 1: throw new InvalidBase64Error();
        case 2: padding = 2; break;
        case 3: padding = 1; break;
            // handle 'proper' length (multiple of 4) by counting padding chars
        case 0:
            while (str.endsWith('=', end)) {
                padding++, end--;
                if (padding > 2) { throw new InvalidBase64Error(); }
            }
            break;
        }

        this._str = str;
        this._idx = start;
        // _end = end of BASE64 chars
        // _pad = end of entire string incl. padding chars
        this._end = end;
        this._pad = end + padding;
    }

    next() {
        while (this._idx < this._end) {
            let code = this._str.charCodeAt(this._idx);
            if (code >= FROM_BASE64.length || FROM_BASE64[code] < 0) {
                throw new InvalidBase64Error();
            }
            let ele = FROM_BASE64[code], siz = 6;
            for (this._idx++; this._idx >= this._end && this._idx < this._pad; this._idx++) {
                // drop bits if there is padding immediately after
                ele >>= 2, siz -= 2;
            }
            return [ele, siz];
        }
        return [0, 0];
    }
}

export class Base64Sink {
    constructor() {
        this._charCodes = [];
        this._padding = '';
    }

    maxBitsPerElem = 6; // 1<<6 = 64

    push(bits) {
        // size == maxBitsPerElem
        this._charCodes.push(TO_BASE64[bits]);
    }

    end(bits, size) {
        // size < maxBitsPerElem
        switch (size) {
        case 4: this.push(bits << 2); this._padding += '='; break;
        case 2: this.push(bits << 4); this._padding += '=='; break;
        case 0: break;
        default: throw new Error('BUG: result not base64 encodable');
        }
    }

    toString(padding = true) {
        let string = String.fromCharCode(...this._charCodes);
        return padding ? string + this._padding : string;
    }
}
