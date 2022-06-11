import { Edit } from '../../model/edit'
import { Button } from '../../component/button'
import { Textarea } from '../../component/textarea'
import { decodeFumen } from '../../format/fumen'

const Body = React.memo(({
    dispatchEditor,
}) => {
    let action = React.useMemo(() => ({
        importDoc(doc) { dispatchEditor({ type: 'apply', payload: Edit.importDoc(doc) }); },
    }), [dispatchEditor]);

    // TODO [#5] custom code format

    let [fumen, setFumen] = React.useState('');

    let importFumen = React.useCallback(() => {
        let doc;
        try {
            doc = decodeFumen(fumen);
        } catch (e) {
            console.error(e);
            alert(`Invalid fumen:\n${e.message}`);
            return;
        }
        action.importDoc(doc.unzip());
    }, [fumen, action.importDoc]);

    function sizeLabel(str) {
        let noun = 'bytes';
        switch (str.length) {
        case 0: return undefined;
        case 1: noun = 'byte'; break;
        }
        return (<h4>{`${str.length} ${noun}`}</h4>);
    }

    return (
        <>
            <Textarea
                value={fumen}
                onChange={setFumen}
            >
                enter "fumen" code or URL
            </Textarea>
            <div className="row">
                <Button onClick={importFumen}>Import fumen</Button>
                {sizeLabel(fumen)}
            </div>
        </>
    );
});

module.exports = {
    title: 'Convert',
    icon: 'share',
    className: 'convert',
    isUnderConstruction: true,
    Body,
};
