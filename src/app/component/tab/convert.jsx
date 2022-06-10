import { Edit } from '../../model/edit'
import { Button } from '../../component/button'
import { Textarea } from '../../component/textarea'
import { decodeFumen } from '../../format/fumen'
import { encodeString, decodeString, DecodeError } from '../../format'

const Body = React.memo(({
    dispatchEditor,
    doc,
}) => {
    let action = React.useMemo(() => ({
        importDoc(doc) { dispatchEditor({ type: 'apply', payload: Edit.importDoc(doc) }); },
    }), [dispatchEditor]);

    let [code, setCode] = React.useState('');
    let [fumen, setFumen] = React.useState('');

    let exportCode = React.useCallback(() => {
        setCode(encodeString(doc.zip()));
    }, [doc, setCode]);

    let importCode = React.useCallback(() => {
        let doc;
        try {
            doc = decodeString(code);
        } catch (e) {
            if (e instanceof DecodeError) {
                alert(e.message);
                console.error(e);
                return;
            } else {
                throw e;
            }
        }
        action.importDoc(doc.unzip());
    }, [code, action.importDoc]);

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
                value={code}
                onChange={setCode}
            >
                enter blueprint code or URL
            </Textarea>
            <div className="row">
                <Button onClick={exportCode}>Export</Button>
                <Button onClick={importCode}>Import</Button>
                {sizeLabel(code)}
            </div>
            <hr />
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
