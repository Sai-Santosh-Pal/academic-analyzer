// Minimal store-only ZIP writer (no compression) for bulk report cards.

let crcTable: number[] | null = null

function makeCrcTable(): number[] {
  const t = new Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
}

export function crc32(data: Uint8Array): number {
  if (!crcTable) crcTable = makeCrcTable()
  let c = 0xffffffff
  for (let i = 0; i < data.length; i++) c = crcTable![(c ^ data[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function u16(v: number): number[] {
  return [v & 0xff, (v >> 8) & 0xff]
}

function u32(v: number): number[] {
  return [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >>> 24) & 0xff]
}

function dosDateTime(now: Date): { time: number[]; date: number[] } {
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2)
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()
  return { time: u16(time), date: u16(date) }
}

export function buildZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const now = new Date()
  const { time, date } = dosDateTime(now)
  const chunks: Uint8Array[] = []
  const central: { header: number[]; name: Uint8Array }[] = []
  let offset = 0

  for (const f of files) {
    const nameBytes = new TextEncoder().encode(f.name)
    const crc = crc32(f.data)
    const size = f.data.length
    const local: number[] = [0x50, 0x4b, 0x03, 0x04, ...u16(20), ...u16(0), ...u16(0), ...time, ...date, ...u32(crc), ...u32(size), ...u32(size), ...u16(nameBytes.length), ...u16(0)]
    chunks.push(new Uint8Array(local))
    chunks.push(nameBytes)
    chunks.push(f.data)
    const header: number[] = [0x50, 0x4b, 0x01, 0x02, ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...time, ...date, ...u32(crc), ...u32(size), ...u32(size), ...u16(nameBytes.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]
    central.push({ header, name: nameBytes })
    offset += 30 + nameBytes.length + size
  }

  const centralOffset = offset
  let cdSize = 0
  for (const entry of central) {
    chunks.push(new Uint8Array(entry.header))
    chunks.push(entry.name)
    cdSize += entry.header.length + entry.name.length
  }
  const eocd: number[] = [0x50, 0x4b, 0x05, 0x06, ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(centralOffset), ...u16(0)]
  chunks.push(new Uint8Array(eocd))

  const total = chunks.reduce((a, c) => a + c.length, 0)
  const out = new Uint8Array(total)
  let p = 0
  for (const c of chunks) {
    out.set(c, p)
    p += c.length
  }
  return out
}