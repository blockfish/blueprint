import { combine } from '../utils'

export const Checkbox = React.memo(({
    className: cls,
    checked,
    onToggle,
    children,
}) => (
    <div className={combine('checkbox', cls)}>
        <label>
            <input
                type="checkbox"
                checked={!!checked}
                disabled={!onToggle}
                onChange={() => onToggle && onToggle(!checked)} />
            <span>{children}</span>
        </label>
    </div>
));
