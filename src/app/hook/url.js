import { Document } from '../model/document'
import { parseURLQuery, encodeString } from '../format'
import { useDelay } from '../hook/utils'

function encodeURL(location, doc) {
    let code = encodeString(doc);
    return `${location.origin}${location.pathname}?${code}`;
}

export function useURLDocument(location = document.location, history = window.history) {
    let ref = React.useRef(null);
    if (!ref.current) {
        ref.current = { saved: null, parsed: null, parseError: null };
        try {
            ref.current.parsed = parseURLQuery(location.search);
        } catch (e) {
            console.error(e);
            ref.current.parseError = e;
        }
        ref.current.parsed ||= Document.init();
        ref.current.saved = ref.current.parsed;
    }

    let update = useDelay(1000, doc => {
        let { saved, parsed, parseError } = ref.current;
        if (doc.zip) {
            doc = doc.zip();
        }
        if (saved && saved.equals(doc)) {
            return;
        }
        let url = encodeURL(location, doc);
        // FIXME: pushState if modified from the initially parsed doc
        // FIXME: handle popstate events
        history.replaceState(null, '', url);
        ref.current.saved = doc;
    });
    update = React.useCallback(update, [ref]);

    return [ref.current.parsed, update];
}
