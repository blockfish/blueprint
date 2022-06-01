import { combine } from '../utils'

export const Button = React.memo(({
    className: cls,
    onClick,
    children,
}) => (
    <div className={combine('button', cls)}>
        <button disabled={!onClick} onClick={() => onClick && onClick(children)}>
            {children}
        </button>
    </div>
));
