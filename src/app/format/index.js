import { decodeFumen } from './fumen'

const FUMEN_REGEX = /^\?[vmd]11[50]@/;

export class UnknownURLFormatError extends Error {
    constructor(query) {
        if (query.length > 6) {
            query = query.substring(0, 6) + '...';
        }
        super(`Unknown URL format: '${query}'`);
    }
}

export function parseURLQuery(query) {
    if (query === '') {
        return null;
    }
    if (FUMEN_REGEX.test(query)) {
        return decodeFumen(query);
    }
    throw new UnknownURLFormatError(query);
}
