import { Edit } from '../../model/edit'
import { Button } from '../../component/button'
import { Textarea } from '../../component/textarea'
import * as Fumen from '../../format/fumen'

const Body = React.memo(({
    dispatchEditor,
}) => {
    let action = React.useMemo(() => ({
        importDoc(doc) { dispatchEditor({ type: 'apply', payload: Edit.importDoc(doc) }); },
    }), [dispatchEditor]);

    let [fumen, setFumen] = React.useState('');
    let importFumen = React.useCallback(() => {
        let doc;
        try {
            doc = Fumen.parse(fumen);
        } catch (e) {
            console.error(e);
            alert(`Invalid fumen:\n${e.message}`);
            return;
        }
        action.importDoc(doc.unzip());
    }, [fumen, action.importDoc]);

    // TODO [#5] custom code format

    return (
        <>
            <Textarea
                value={fumen}
                onChange={setFumen}
            >
                enter "fumen" code or URL
            </Textarea>
            <Button onClick={importFumen}>Import fumen</Button>
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
