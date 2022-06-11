import { Edit } from '../model/edit'
import { Board } from '../component/board'
import { ColorPicker } from '../component/color-picker'
import { Sidebar } from '../component/sidebar'
import { Toolbar } from '../component/toolbar'
import { useControls } from '../hook/controls'
import { useDocumentFromURL } from '../hook/url'
import { useEditor } from '../hook/editor'
import { useGlobalKeyboard } from '../hook/keyboard'
import { useLocalStorageDatabase } from '../hook/storage'
import { usePalette } from '../hook/palette'
import { useRisingEdge } from '../hook/utils'
import { useStacker } from '../hook/stacker'
import { useTab } from '../hook/tab'

export const Main = ({}) => {
    let storageDB = useLocalStorageDatabase();
    let initialDoc = useDocumentFromURL();

    let [tab, setTab] = useTab(storageDB);
    let [keymap, handling, dispatchControls] = useControls(storageDB);
    let [palette, setPalette] = usePalette(storageDB);
    let [doc, history, dispatchEditor] = useEditor(initialDoc);

    // TODO [#3] eugh -- maybe move all this to index.jsx?
    let action = React.useMemo(() => ({
        undo() { dispatchEditor({ type: 'undo' }); },
        redo() { dispatchEditor({ type: 'redo' }); },
        nextPage() { dispatchEditor({ type: 'next' }); },
        prevPage() { dispatchEditor({ type: 'prev' }); },
        applyEdit(e) { dispatchEditor({ type: 'apply', payload: e }); },
        reset() { dispatchEditor({ type: 'apply', payload: Edit.RESET }); },
        newPage() { dispatchEditor({ type: 'apply', payload: Edit.CREATE_PAGE }); },
        delPage() { dispatchEditor({ type: 'apply', payload: Edit.DELETE_PAGE }); },
        togglePiece() { dispatchEditor({ type: 'apply', payload: Edit.TOGGLE_PIECE }); },
    }) , [dispatchEditor]);

    let dispatchStacker = useStacker(handling, doc.current, action.applyEdit);

    useGlobalKeyboard(keymap, a => {
        switch (a) {
        case 'tab1': setTab(0); break;
        case 'tab2': setTab(1); break;
        case 'tab3': setTab(2); break;
        case 'tab4': setTab(3); break;

        case 'undo': action.undo(); break;
        case 'redo': action.redo(); break;
        case 'reset': action.reset(); break;
        case 'next-page': action.nextPage(); break;
        case 'prev-page': action.prevPage(); break;
        case 'new-page': action.newPage(); break;
        case 'del-page': action.delPage(); break;
        case 'toggle': action.togglePiece(); break;

        default: dispatchStacker(a); break;
        }
    });

    let page = doc.current;

    return (
        <main className={useFadeInClassName()}>
            <Board
                dispatchEditor={dispatchEditor}
                page={page}
                palette={palette} />
            <Toolbar
                dispatchEditor={dispatchEditor}
                doc={doc}
                history={history}
                setTab={setTab}
                tab={tab} />
            <ColorPicker
                setPalette={setPalette}
                palette={palette} />
            <Sidebar
                dispatchControls={dispatchControls}
                dispatchEditor={dispatchEditor}
                setPalette={setPalette}
                doc={doc}
                page={page}
                handling={handling}
                keymap={keymap}
                palette={palette}
                tab={tab} />
        </main>
    );
};

function useFadeInClassName() {
    return useRisingEdge() ? 'fade in' : 'fade out';
}
