import { Main } from './component/main'

window['InitializeApp'] = rootContainer => {
    ReactDOM.createRoot(rootContainer)
        .render(<Main />);
};
