import icons from '../../data/icons'

export const Icon = React.memo(({
    children: icon,
}) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={icons[icon].viewBox}
        width="1em"
        height="1em"
    >
        <path d={icons[icon].path} />
    </svg>
));
