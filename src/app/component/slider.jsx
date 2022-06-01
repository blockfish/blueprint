import { combine } from '../utils'

export const Slider = React.memo(({
    className: cls,
    info,
    value,
    onChange,
}) => (
    <div className={combine('slider', cls)}>
        <input
            type="range"
            min={info.min}
            max={info.max}
            step={info.step}
            value={value}
            disabled={!onChange}
            onChange={ev => onChange && onChange(+ev.target.value)} />
        <label onClick={onChange && (() => showNumberPrompt(info.name, value, onChange))}>
            <span>{`${info.name}: `}{info.format(value)}</span>
        </label>
    </div>
));

function showNumberPrompt(name, prev, callback) {
    let str = prompt(`Enter ${name} value:`, prev);
    if (str === null) {
        return;
    }
    let val = parseFloat(str);
    if (isNaN(val)) {
        alert('Invalid value');
        return;
    }
    callback(val);
}
