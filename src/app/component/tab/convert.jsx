import { Button } from '../../component/button'
import { Textarea } from '../../component/textarea'

const Body = React.memo(({
}) => {
    // TODO [#5 #6]
    let [fumen, setFumen] = React.useState('');
    return (
        <>
            <Textarea
                value={fumen}
                onChange={setFumen}
            >
                enter "fumen" code
            </Textarea>
            <Button onClick={null}>Generate (implemented)</Button>
            <Button onClick={null}>Load (implemented)</Button>
            <Button onClick={null}>Load from image (implemented)</Button>
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
