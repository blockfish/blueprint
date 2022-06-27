import skin from '../../data/skin'
import { combine } from '../utils'

const COLORS = [...'gTZLOSJI'];

export const ColorPicker = React.memo(({
    palette,
    setPalette,
}) => (
    <section className="container color-picker">
        {COLORS.map((color, i) => (
            <button
                key={color}
                className={color === palette.color ? 'selected' : null}
                style={{ backgroundColor: skin.block[color][0] }}
                onClick={() => setPalette(p => p.setColor(color))} />
        ))}
    </section>
));

