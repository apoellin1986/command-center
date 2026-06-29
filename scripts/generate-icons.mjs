// Generates PWA PNG icons with zero dependencies (pure Node + zlib).
// Draws a dark rounded square with an accent-blue inset and a white upward
// arrow — the "transformation / progress" mark.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public')
mkdirSync(outDir, { recursive: true })

// --- CRC32 (for PNG chunks) ---
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePNG(size, pixels) {
  // pixels: Uint8Array RGBA length size*size*4
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  // raw scanlines with filter byte 0
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0
    pixels.copy ? pixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
              : raw.set(pixels.subarray(y * stride, y * stride + stride), y * (stride + 1) + 1)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function draw(size) {
  const px = Buffer.alloc(size * size * 4)
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a
  }
  const inRoundRect = (x, y, x0, y0, w, h, rad) => {
    if (x < x0 || y < y0 || x >= x0 + w || y >= y0 + h) return false
    const dx = Math.min(x - x0, x0 + w - 1 - x)
    const dy = Math.min(y - y0, y0 + h - 1 - y)
    if (dx >= rad || dy >= rad) return true
    return (rad - dx) ** 2 + (rad - dy) ** 2 <= rad ** 2
  }

  const inset = Math.round(size * 0.09)
  const innerW = size - inset * 2
  const rad = Math.round(size * 0.22)

  // arrow geometry (upward chevron)
  const cx = size / 2
  const apexY = size * 0.28
  const baseY = size * 0.7
  const halfW = size * 0.22
  const notchY = size * 0.6

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // base dark background (full bleed rounded)
      if (inRoundRect(x, y, 0, 0, size, size, rad + inset)) set(x, y, 10, 10, 11, 255)
      // accent inset panel
      if (inRoundRect(x, y, inset, inset, innerW, innerW, rad)) set(x, y, 59, 130, 246, 255)
      // white upward arrow (filled, with a notch at the bottom)
      const t = (y - apexY) / (baseY - apexY)
      if (t >= 0 && t <= 1) {
        const spread = halfW * t
        if (x >= cx - spread && x <= cx + spread) {
          // cut a triangular notch from the bottom to form a chevron
          const nt = (y - notchY) / (baseY - notchY)
          if (y < notchY || x <= cx - (halfW * (notchY - apexY) / (baseY - apexY)) * (1 - nt) || x >= cx + (halfW * (notchY - apexY) / (baseY - apexY)) * (1 - nt)) {
            set(x, y, 255, 255, 255, 255)
          }
        }
      }
    }
  }
  return px
}

for (const size of [180, 192, 512]) {
  const png = encodePNG(size, draw(size))
  const name = size === 180 ? 'apple-touch-icon.png' : `pwa-${size}x${size}.png`
  writeFileSync(join(outDir, name), png)
  console.log('wrote', name)
}
