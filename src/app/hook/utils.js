// returns false momentarily when component is mounted, then immediately switches to true.
export function useRisingEdge() {
    let [active, setActive] = React.useState(false);
    React.useEffect(() => setActive(true), [active]);
    return active;
}

// returns a function that acts like 'func', but has 'delay' ms delay, and if the function
// is called again before the delay is over, then the previous call is cancelled.
export function useDelay(delay, func) {
    let tm = React.useRef(null);
    React.useEffect(() => () => clearTimeout(tm.current), [tm]);
    return (...args) => {
        clearTimeout(tm.current);
        tm.current = setTimeout(() => {
            tm.current = null;
            func(...args);
        }, delay);
    };
}
