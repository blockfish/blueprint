import skin from '../../data/skin'
import { combine } from '../utils'

const COLORS = [...'gZLOSJI'];

export const ColorPicker = React.memo(({
    palette,
    dispatchPalette,
}) => {
    let setColor = React.useCallback(c => {
        dispatchPalette(p => p.setColor(c));
    }, [dispatchPalette]);
    return (
        <section className="container color-picker">
            {COLORS.map((color, i) => (
                <button
                    key={color}
                    className={color === palette.color ? 'selected' : null}
                    style={{ backgroundColor: skin.block[color].fill }}
                    onClick={() => setColor(color)} />
            ))}
        </section>
    );
});
