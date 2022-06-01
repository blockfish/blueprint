import { combine } from '../utils'

function useRisingEdge() {
    let [active, setActive] = React.useState(false);
    React.useEffect(() => setActive(true), [active]);
    return active;
}

export function useFadeIn() {
    let edge = useRisingEdge();
    return combine('fade', edge ? 'in' : 'out');
}
