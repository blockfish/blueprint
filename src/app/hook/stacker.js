import { Stacker } from '../stacker'
import { Edit } from '../model/edit'

export function useStacker(handling, currentPage, applyEdit) {
    let ref = React.useRef(null);
    let stacker = (ref.current ||= new Stacker());
    stacker.handling = handling;

    stacker.onMove = (_m) => applyEdit(Edit.piece(stacker.piece, stacker.queue));
    stacker.onHold = () => applyEdit(Edit.piece(stacker.piece, stacker.queue));
    stacker.onLock = (droppedPiece) => applyEdit(
        Edit.lock(droppedPiece, stacker.piece, stacker.queue, stacker.playfield)
    );

    React.useEffect(() => {
        // XXX(iitalics): this seems like a logic loop, but it's not. typically, calls to
        // applyEdit() will cause currentPage to be modified, but these modifications will
        // already have been applied by the stacker, so reassigning these fields is a
        // no-op. however, these lines are incredibly important so that external changes
        // like resetting, navigating between pages, toggling piece, etc. are propogated
        // to the stacker correctly.
        stacker.playfield = currentPage.playfield;
        stacker.piece = currentPage.piece;
        stacker.queue = currentPage.queue;
    }, [currentPage]);

    React.useEffect(() => {
        stacker.start();
        return () => stacker.stop();
    }, [stacker]);

    return React.useCallback(action => stacker.dispatchAction(action), [stacker]);
}
