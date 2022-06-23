import { Main } from './component/main'

export function init(rootContainer) {
    ReactDOM.createRoot(rootContainer).render(<Main />);
    manageRequestHeader(document.getElementsByTagName('header')[0]);
}

const REQUEST_KEY = 'request-seen';
const REQUEST_NAME = 'survey-1';

function manageRequestHeader(elem) {
    if (!elem) {
        return;
    }

    if (localStorage.getItem(REQUEST_KEY) === REQUEST_NAME) {
        return;
    }

    let hiddenMarginTop = elem.style.top;
    let closeBtn = elem.getElementsByTagName('button')[0];
    closeBtn.onclick = () => elem.style.top = hiddenMarginTop;

    setTimeout(() => elem.style.top = 0, 10000);
    setTimeout(() => localStorage.setItem(REQUEST_KEY, REQUEST_NAME), 15000);
}
