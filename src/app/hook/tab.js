export function useTab(db) {
    let [tab, setTab] = React.useState(db.load('tab') || 0);
    React.useEffect(() => db.store('tab', tab), [db, tab]);
    return [tab, setTab];
}
