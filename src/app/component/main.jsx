import { Move } from '../model/piece'
import { Edit } from '../model/edit'
import { Board } from '../component/board'
import { ColorPicker } from '../component/color-picker'
import { Sidebar } from '../component/sidebar'
import { Toolbar } from '../component/toolbar'
import { useAutorepeat } from '../hook/autorepeat'
import { useControls } from '../hook/controls'
import { useEditor } from '../hook/editor'
import { useFadeIn } from '../hook/fade'
import { useGlobalKeyboard } from '../hook/keyboard'
import { useLocalStorageDatabase } from '../hook/storage'
import { usePalette } from '../hook/palette'
import { useTab } from '../hook/tab'

export const Main = ({}) => {
    let storageDB = useLocalStorageDatabase();

    let [tab, setTab] = useTab(storageDB);
    let [keymap, handling, dispatchControls] = useControls(storageDB);
    let [palette, setPalette] = usePalette(storageDB);

    let [doc, history, dispatchEditor] = useEditor();
    let page = doc.current;
    // TODO [#3] eugh -- maybe move all this to index.jsx?
    let editorAction = React.useMemo(() => ({
        undo() { dispatchEditor({ type: 'undo' }); },
        redo() { dispatchEditor({ type: 'redo' }); },
        nextPage() { dispatchEditor({ type: 'next' }); },
        prevPage() { dispatchEditor({ type: 'prev' }); },
        reset() { dispatchEditor({ type: 'apply', payload: Edit.RESET }); },
        newPage() { dispatchEditor({ type: 'apply', payload: Edit.CREATE_PAGE }); },
        delPage() { dispatchEditor({ type: 'apply', payload: Edit.DELETE_PAGE }); },
        movePiece(m) { dispatchEditor({ type: 'apply', payload: Edit.movePiece(m) }); },
        toggle() { dispatchEditor({ type: 'apply', payload: Edit.TOGGLE_PIECE }); },
        hold() { dispatchEditor({ type: 'apply', payload: Edit.HOLD }); },
        lock() { dispatchEditor({ type: 'apply', payload: Edit.LOCK_PIECE }); },
    }) , [dispatchEditor]);

    let autoShift = useAutorepeat(handling.das, handling.arr, editorAction.movePiece);
    let softDrop = useAutorepeat(0, handling.sdr, editorAction.movePiece);

    useGlobalKeyboard(keymap, action => {
        switch (action) {
        case 'undo': editorAction.undo(); break;
        case 'redo': editorAction.redo(); break;
        case 'tab1': setTab(0); break;
        case 'tab2': setTab(1); break;
        case 'tab3': setTab(2); break;
        case 'tab4': setTab(3); break;
        case 'reset': editorAction.reset(); break;
        case 'next-page': editorAction.nextPage(); break;
        case 'prev-page': editorAction.prevPage(); break;
        case 'new-page': editorAction.newPage(); break;
        case 'del-page': editorAction.delPage(); break;

        case 'toggle': editorAction.toggle(); break;
        case 'hold': editorAction.hold(); break;
        case 'lock': editorAction.lock(); break;
        case 'ccw': editorAction.movePiece(Move.CCW); break;
        case 'cw': editorAction.movePiece(Move.CW); break;

        case 'drop':
            softDrop.charge(Move.DROP, Move.SONIC_DROP);
            break;
        case 'drop:up':
            softDrop.release(Move.DROP);
            break;

        case 'left':
            editorAction.movePiece(Move.LEFT);
            autoShift.charge(Move.LEFT, Move.INF_LEFT);
            break;
        case 'left:up':
            autoShift.release(Move.LEFT);
            break;

        case 'right':
            editorAction.movePiece(Move.RIGHT);
            autoShift.charge(Move.RIGHT, Move.INF_RIGHT);
            break;
        case 'right:up':
            autoShift.release(Move.RIGHT);
            break;
        }
    });

    let fadeInCls = useFadeIn();

    return (
        <main className={fadeInCls}>
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
                page={page}
                handling={handling}
                keymap={keymap}
                palette={palette}
                tab={tab} />
        </main>
    );
};
