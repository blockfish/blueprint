import { BoardGraphics } from '../graphics'
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

const BoardCanvas = ({
    playfield,
    queue,
    piece,
    onDrag,
    onDragEnd,
}) => {
    let boardRef = React.useRef(null);
    let board = (boardRef.current ||= new BoardGraphics());

    board.onDragStart = onDrag;
    board.onDrag = onDrag;
    board.onDragEnd = onDragEnd;

    React.useEffect(() => board.setQueue(queue), [board, queue]);
    React.useEffect(() => board.setPlayfield(playfield), [board, playfield]);
    React.useEffect(() => board.setPiece(piece), [board, piece]);

    let bind = React.useCallback(c => board.setCanvas(c), [board]);
    return (<canvas ref={bind} />);
};

const BoardComment = React.memo(({
    children: text,
}) => text ? (
    <p className="block comment">{text}</p>
) : null);
