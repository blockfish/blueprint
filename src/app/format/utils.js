export function decodeVarint(reader) {
    let acc = 0, len = 0;
    while (reader.read()) {
        acc |= reader.read(4) << len;
        len += 4;
    }
    return acc;
}

export function encodeVarint(writer, val) {
    if (val < 0) {
        throw new Error('negative varint');
    }
    while (val > 0) {
        writer.write(1);
        writer.write(val & 0xf, 4);
        val >>= 4;
    }
    writer.write(0);
}

export function* fromRunLengths(lens) {
    let val = 0, enabled = true;
    for (let len of lens) {
        if (enabled) {
            for (let i = 0; i < len; i++) {
                yield val + i;
            }
        }
        val += len;
        enabled = !enabled;
    }
}

export function* toRunLengths(vals) {
    let start = 0, end = 0;
    for (let val of vals) {
        if (val < end) { throw new RangeError; }
        if (val === end) {
            end++;
        } else {
            yield end - start;
            yield val - end;
            start = val;
            end = val + 1;
        }
    }
    if (end > start) {
        yield end - start;
    }
}
