import { Icon } from '../component/icon'

export const TABS = [
    require('./tab/editing'),
    require('./tab/analysis'),
    require('./tab/convert'),
    require('./tab/settings'),
];

export const Sidebar = (props) => {
    // TODO: "tab provider" instead of via props
    let tab = TABS[props.tab];

    let underConstruction = null;
    if (tab.isUnderConstruction) {
        underConstruction = (
            <h4 className="block warning">
                <div className="icon"><Icon>gear</Icon></div>
                Under Construction
            </h4>
        );
    }

    return (
        <section className={`container sidebar ${tab.className}`}>
            <h3 className="block">{tab.title}</h3>
            {underConstruction}
            <div className="body">
                <tab.Body {...props} />
            </div>
        </section>
    );
};
