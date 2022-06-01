import { combine } from '../utils'
import { Icon } from '../component/icon'

export const IconButton = React.memo(({
    className: cls,
    selected,
    onClick,
    children,
}) => (
    <div className={combine('icon-button', cls, selected && 'selected')}>
        <button disabled={!onClick} onClick={onClick || null}>
            <Icon>{children}</Icon>
        </button>
    </div>
));
