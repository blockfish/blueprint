import { decodeFumen } from './fumen'

const FUMEN_REGEX = /^\?[vmd]11[50]@/;

export class UnknownURLFormatError extends Error {
    constructor() {
        super('unknown URL format');
    }
}

export function parseURLQuery(query) {
    if (query === '') {
        return null;
    }
    if (FUMEN_REGEX.test(query)) {
        return decodeFumen(query);
    }
    throw new UnknownURLFormatError();
}
