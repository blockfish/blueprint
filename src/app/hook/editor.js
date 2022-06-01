import { Document } from '../model/document'
import { Page } from '../model/page'
import { History } from '../model/history'

export function useEditor() {
    let [state, dispatch] = React.useReducer(reduce, null, init);
    return [state.doc, state.history, dispatch];
}

function init() {
    // TODO [#2] init from localstorage
    return {
        doc: Document.init(),
        history: History.EMPTY,
        flow: null,
    };
}

function reduce({ doc, history, flow }, action) {
    switch (action.type) {
    case 'next':
        flow = null;
        doc = doc.next();
        break;

    case 'prev':
        flow = null;
        doc = doc.prev();
        break;

    case 'undo':
        flow = null;
        [doc, history] = history.undo(doc);
        break;

    case 'redo':
        flow = null;
        [doc, history] = history.redo(doc);
        break;

    case 'apply':
        {
            let edit = action.payload;
            let newFlow = null;
            if (edit.flowType) {
                newFlow = (flow instanceof edit.flowType) ? flow : edit.initFlow(doc);
            }
            let newDoc = edit.apply(doc, newFlow);
            if (doc !== newDoc) {
                if (newFlow === null || flow !== newFlow) {
                    history = history.save(doc);
                }
                doc = newDoc;
                flow = newFlow;
            }
            break;
        }

    case 'end':
        {
            let flowType = action.payload;
            if (flow instanceof flowType) {
                flow = null;
            }
            break;
        }
    }

    return { doc, history, flow };
}
