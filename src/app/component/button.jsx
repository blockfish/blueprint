import { combine, buttonUnfocusCallback } from '../utils'

export const Button = React.memo(({
    className: cls,
    onClick,
    children,
}) => (
    <div className={combine('button', cls)}>
        <button disabled={!onClick} onClick={buttonUnfocusCallback(onClick)}>
            {children}
        </button>
    </div>
));
