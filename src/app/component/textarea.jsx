import { combine, cancelBubble } from '../utils'

export const Textarea = React.memo(({
    className: cls,
    value,
    onChange,
    onBlur,
    children,
}) => (
    <div className={combine('textarea', cls)}>
        <label>
            <textarea
                value={value}
                placeholder={children}
                disabled={!onChange}
                onKeyDown={cancelBubble}
                onKeyUp={cancelBubble}
                onChange={ev => onChange && onChange(ev.target.value)}
                onBlur={() => onBlur && onBlur(value)} />
        </label>
    </div>
));
