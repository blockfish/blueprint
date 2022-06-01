import { Button } from '../../component/button'
import { Keybindings } from '../../component/keybindings'
import { Slider } from '../../component/slider'

// TODO [#8] this list is huge, we should have multiple tabs

const ACTIONS = [
    { action: 'undo',      label: 'Undo' },
    { action: 'redo',      label: 'Redo' },
    { action: 'left',      label: 'Move Left' },
    { action: 'right',     label: 'Move Right' },
    { action: 'ccw',       label: 'Rotate CCW' },
    { action: 'cw',        label: 'Rotate CW' },
    { action: 'drop',      label: 'Soft Drop' },
    { action: 'lock',      label: 'Hard Drop' },
    { action: 'hold',      label: 'Hold' },
    { action: 'toggle',    label: 'Toggle Piece' },
    { action: 'reset',     label: 'Reset All' },
    { action: 'prev-page', label: 'Prev Page' },
    { action: 'next-page', label: 'Next Page' },
    { action: 'new-page',  label: 'Create Page' },
    { action: 'del-page',  label: 'Delete Page' },
    { action: 'tab1',      label: 'Tab: Editing' },
    { action: 'tab2',      label: 'Tab: Analysis' },
    { action: 'tab3',      label: 'Tab: Convert' },
    { action: 'tab4',      label: 'Tab: Settings' },
];

const ms = x => `${x}ms`;

const DAS = {
    name: 'DAS',
    min: 2,
    max: 250,
    step: 2,
    format: ms,
};

const ARR = {
    name: 'ARR',
    min: 0,
    max: 50,
    step: 1,
    format: ms,
};

const SDR = {
    name: 'SDR',
    min: 0,
    max: 100,
    step: 1,
    format: ms,
};

const Body = React.memo(({
    keymap,
    handling,
    dispatchControls,
}) => {
    let action = React.useMemo(() => makeControlsActions(dispatchControls), [dispatchControls]);
    let reset = React.useCallback(() => promptRestore(action.reset), [action.reset]);
    return (
        <>
            <Keybindings actions={ACTIONS} keymap={keymap} onSetKey={action.setKey} />
            <Slider info={DAS} value={handling.das} onChange={action.setDAS} />
            <Slider info={ARR} value={handling.arr} onChange={action.setARR} />
            <Slider info={SDR} value={handling.sdr} onChange={action.setSDR} />
            <Button onClick={reset}>Restore Defaults</Button>
        </>
    );
});

function makeControlsActions(dispatch) {
    return {
        reset() { dispatch({ type: 'reset' }); },
        setKey(b) { dispatch({ type: 'bind', payload: b }); },
        setDAS(das) { dispatch({ type: 'tune', payload: h => h.setDAS(das) }); },
        setARR(arr) { dispatch({ type: 'tune', payload: h => h.setARR(arr) }); },
        setSDR(sdr) { dispatch({ type: 'tune', payload: h => h.setSDR(sdr) }); },
    };
}

function promptRestore(callback) {
    if (confirm('Really restore default keybindings / handling?')) {
        callback();
    }
}

module.exports = {
    title: 'Settings',
    icon: 'gear',
    className: 'settings',
    Body,
};
