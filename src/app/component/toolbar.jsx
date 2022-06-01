import { Edit } from '../model/edit'
import { IconButton } from '../component/icon-button'
import { TABS } from '../component/sidebar'

export const Toolbar = ({
    dispatchEditor,
    doc,
    history,
    setTab,
    tab,
}) => {
    let action = React.useMemo(() => ({
        undo() { dispatchEditor({ type: 'undo' }); },
        redo() { dispatchEditor({ type: 'redo' }); },
        nextPage() { dispatchEditor({ type: 'next' }); },
        prevPage() { dispatchEditor({ type: 'prev' }); },
        reset() { dispatchEditor({ type: 'apply', payload: Edit.RESET }); },
        newPage() { dispatchEditor({ type: 'apply', payload: Edit.CREATE_PAGE }); },
        delPage() { dispatchEditor({ type: 'apply', payload: Edit.DELETE_PAGE }); },
    }), [dispatchEditor]);
    return (
        <section className="container toolbar">
            <DocControls
                onReset={action.reset}
                onUndo={history.undos && action.undo}
                onRedo={history.redos && action.redo} />
            <PageIndex
                pageIndex={doc.index}
                pageCount={doc.count} />
            <PageControls
                onNextPage={(doc.index < doc.count - 1) && action.nextPage}
                onPrevPage={(doc.index > 0) && action.prevPage}
                onNewPage={action.newPage}
                onDelPage={(doc.index > 0 || doc.count > 1) && action.delPage} />
            <hr />
            <TabControls
                tab={tab}
                onSetTab={setTab} />
        </section>
    );
};

const DocControls = React.memo(({
    onReset,
    onUndo,
    onRedo,
}) => (
    <div className="button-group doc-buttons">
        <IconButton onClick={onReset}>document</IconButton>
        <IconButton onClick={onUndo}>undo</IconButton>
        <IconButton onClick={onRedo}>redo</IconButton>
    </div>
));

const PageIndex = React.memo(({
    pageCount,
    pageIndex,
}) => (
    <h2 className="page-index">{`Page ${pageIndex + 1}/${pageCount}`}</h2>
));

const PageControls = React.memo(({
    onDelPage,
    onNewPage,
    onNextPage,
    onPrevPage,
}) => (
    <div className="button-group page-buttons">
        <IconButton onClick={onPrevPage}>prev</IconButton>
        <IconButton onClick={onNextPage}>next</IconButton>
        <IconButton onClick={onNewPage}>duplicate</IconButton>
        <IconButton onClick={onDelPage}>trash</IconButton>
    </div>
));

const TabControls = React.memo(({
    tab,
    onSetTab,
}) => (
    <div className="button-group tab-buttons">
        {TABS.map(({ icon, className }, i) => (
            <IconButton
                key={className}
                className={className}
                selected={tab === i}
                onClick={onSetTab && (() => onSetTab(i))}
            >
                {icon}
            </IconButton>
        ))}
    </div>
));
