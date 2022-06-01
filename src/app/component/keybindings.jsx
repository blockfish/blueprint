import { combine, genUniqueId } from '../utils'
import { Key } from '../model/keymap'

export const Keybindings = React.memo(({
    className: cls,
    actions,
    keymap,
    onSetKey,
}) => {
    // keep track of all <input> refs here, that way we can pass adjacent refs to each
    // KeybindingInput.
    let refs = React.useRef(null).current ||= [];
    while (refs.length < actions.length) {
        refs.push({ current: null });
    }
    return (
        <div className={combine('keybindings', cls)}>
            {actions.map(({ action, label }, i) => (
                <KeybindingInput
                    key={action}
                    label={label}
                    binding={keymap.getBinding(action)}
                    inputRef={refs[i]}
                    nextInputRef={refs[i + 1]}
                    onSet={key => onSetKey && onSetKey({ action, key })} />
            ))}
        </div>
    );
});

const KeybindingInput = ({
    label,
    binding,
    inputRef,
    nextInputRef, // if non-null, autofocus to this ref after assigning a keybinding
    onSet,
}) => {
    let inputId = React.useMemo(() => genUniqueId('keybindings-entry-'), [inputRef]);

    function onInputFocus() {
        inputRef?.current?.setSelectionRange(0, 0);
    }

    function onInputKeyDown(keyEv) {
        if (keyEv.target !== inputRef?.current) {
            return;
        }

        let key = Key.fromKeyEvent(keyEv);
        if (!key) {
            return;
        }

        if (key.noCtrl === Key.get('Escape')) {
            // escape -> unset
            key = null;
        }

        inputRef?.current?.blur();
        nextInputRef?.current?.focus();

        keyEv.stopPropagation();
        keyEv.preventDefault();
        onSet(key);
    }

    return (
        <div className="entry">
            <label htmlFor={inputId}><span>{label}</span></label>
            <hr />
            <input
                type="text"
                id={inputId}
                ref={inputRef}
                value={binding || ''}
                placeholder="(unset)"
                onChange={() => { /* ignore */ }}
                onFocus={onInputFocus}
                onKeyDown={onInputKeyDown} />
        </div>
    );
};
