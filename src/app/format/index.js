import { BitReader, BitWriter, Base64Stream, Base64Sink } from './bits'
import { decodeFumen } from './fumen'
import * as V1 from './v1'

const FUMEN_REGEX = /^\?[vmd]11[50]@/;
const BLUEPRINT_REGEX = /^\?b[0-9]+@/;

export class UnknownURLFormatError extends Error {
    constructor(query) {
        if (query.length > 6) {
            query = query.substring(0, 6) + '...';
        }
        super(`Unknown URL format: '${query}'`);
    }
}

export class DecodeError extends Error {
    constructor(err) {
        super(`Invalid blueprint code:\n${err.message}`, { cause: err });
    }
}

export function parseURLQuery(query) {
    if (query === '') {
        return null;
    }
    if (FUMEN_REGEX.test(query)) {
        return decodeFumen(query);
    }
    if (BLUEPRINT_REGEX.test(query)) {
        return decodeString(query);
    }
    throw new UnknownURLFormatError(query);
}

export function encodeString(doc) {
    let out = new Base64Sink();
    V1.encode(new BitWriter(out), V1.compile(doc));
    return 'b1@' + out.toString(false);
}

export function decodeString(str) {
    try {
        let start = str.indexOf('?') + 1;
        if (start >= str.length) {
            throw new Error('Empty input');
        }
        if (str.startsWith('b1@', start)) {
            let inp = new Base64Stream(str, start + 3);
            return V1.execute(V1.decode(new BitReader(inp)));
        } else {
            throw new Error('Unrecognized blueprint version');
        }
    } catch (e) {
        throw new DecodeError(e);
    }
}
