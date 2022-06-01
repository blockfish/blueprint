import { BoardRenderer } from '../renderer'
import { Edit, Flow } from '../model/edit'

export const Board = ({
    dispatchEditor,
    page,
    palette,
}) => {
    let action = React.useMemo(() => ({
        draw(pos) { dispatchEditor({ type: 'apply', payload: Edit.draw(palette, pos) }); },
        endDraw() { dispatchEditor({ type: 'end', payload: Flow.Draw }); },
    }), [palette, dispatchEditor]);
    return (
        <section className="board">
            <BoardCanvas
                playfield={page.playfield}
                queue={page.queue}
                piece={page.piece}
                onDrag={action.draw}
                onDragEnd={action.endDraw} />
            <BoardComment>{page.comment}</BoardComment>
        </section>
    );
};

const BoardCanvas = React.memo(({
    playfield,
    queue,
    piece,
    onDrag,
    onDragEnd,
}) => {
    let playfieldRendererRef = React.useRef(null);
    let playfieldRenderer = (playfieldRendererRef.current ||= new BoardRenderer());
    playfieldRenderer.onDragStart = onDrag;
    playfieldRenderer.onDrag = onDrag;
    playfieldRenderer.onDragEnd = onDragEnd;

    let onCanvasElement = React.useCallback(canvas => {
        playfieldRenderer.setCanvas(canvas);
    }, [playfieldRenderer]);

    playfieldRenderer.setMatrix(playfield);
    playfieldRenderer.setHold(queue.hold);
    playfieldRenderer.setPreviews(queue.previews);
    playfieldRenderer.setPiece(piece);

    return (<canvas ref={onCanvasElement} />);
});

const BoardComment = React.memo(({
    children: text,
}) => text ? (
    <p className="block comment">{text}</p>
) : null);
