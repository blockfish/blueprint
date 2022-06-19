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
