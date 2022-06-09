import { parseURLQuery } from '../format'

export function useDocumentFromURL() {
    let ref = React.useRef(null);
    let initialParse = ref.current;
    if (!initialParse) {
        initialParse = ref.current = {
            parsed: null,
            error: null,
        };
        try {
            initialParse.parsed = parseURLQuery(document.location.search);
        } catch (e) {
            console.error('error parsing from URL:', e.message);
            initialParse.error = e;
        }
    }

    // TODO [#5] url auto update

    return initialParse.parsed;
}
