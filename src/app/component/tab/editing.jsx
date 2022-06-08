import { Edit, Flow } from '../../model/edit'
import { Button } from '../../component/button'
import { Checkbox } from '../../component/checkbox'
import { QueueEntry } from '../../component/queue-entry'
import { Textarea } from '../../component/textarea'

const Body = React.memo(({
    dispatchEditor,
    page,
    palette,
    setPalette,
}) => {
    let action = React.useMemo(() => ({
        setQueue(q) { dispatchEditor({ type: 'apply', payload: Edit.queue(q) }); },
        togglePiece() { dispatchEditor({ type: 'apply', payload: Edit.TOGGLE_PIECE }); },
        toggleRandomizer() { dispatchEditor({ type: 'apply', payload: Edit.TOGGLE_RANDOMIZER }); },
        setComment(text) { dispatchEditor({ type: 'apply', payload: Edit.comment(text) }); },
        endComment() { dispatchEditor({ type: 'end', payload: Flow.Comment }); },
        mirror() { dispatchEditor({ type: 'apply', payload: Edit.MIRROR }); },
        clear() { dispatchEditor({ type: 'apply', payload: Edit.CLEAR }); },
        toggleFillRow() { setPalette(p => p.setFillRow(!p.fillRow)); },
    }), [dispatchEditor, setPalette]);

    let togglePiece = (page.piece || !page.queue.isEmpty) ? action.togglePiece : null;
    let hasRandomizer = !!page.queue.randomizer;

    // TODO [#7] cheese garbage
    // let [garbage, setGarbage] = React.useState(false);

    return (
        <>
            <Checkbox checked={palette.fillRow} onToggle={action.toggleFillRow}>Fill row</Checkbox>
            <div className="row">
                <Button onClick={action.mirror}>Mirror</Button>
                <Button onClick={action.clear}>Clear</Button>
            </div>
            <hr />
            <QueueEntry queue={page.queue} onChange={action.setQueue} />
            <Checkbox checked={!!page.queue.randomizer} onToggle={action.toggleRandomizer}>7bag randomizer</Checkbox>
            <Checkbox checked={!!page.piece} onToggle={togglePiece}>Current piece</Checkbox>
            <hr />
            <Textarea
                value={page.comment}
                onChange={action.setComment}
                onBlur={action.endComment}
            >
                write comment for this page
            </Textarea>
        </>
    );
});

module.exports = {
    title: 'Editing',
    icon: 'pencil',
    className: 'editing',
    Body,
};
