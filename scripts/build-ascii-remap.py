FROM_FILE = 'src/data/v1-text-from-ascii.bin'
TO_FILE = 'src/data/v1-text-to-ascii.bin'

ORDER = '\0' # important than nul terminator is still 0
ORDER += " etaoinsrhdlucmfywgpbvkxqjz.,"
ORDER += "ETAOINSRHDLUCMFYWGPBVKXQJZ"
ORDER += "0123456789"
ORDER += "!?'\"()[]{}@#$%^&*_+-=|;:<>/\\"

leftover = set(range(128))
from_ascii = [0 for i in range(128)]
to_ascii = [0 for i in range(128)]

for i, asc in enumerate(map(ord, ORDER)):
    new = i
    from_ascii[asc] = new
    to_ascii[new] = asc
    leftover.remove(asc)

for i, asc in enumerate(leftover):
    new = i + len(ORDER)
    from_ascii[asc] = new
    to_ascii[new] = asc

with open(TO_FILE, 'wb') as f:
    f.write(bytes(to_ascii))

with open(FROM_FILE, 'wb') as f:
    f.write(bytes(from_ascii))
