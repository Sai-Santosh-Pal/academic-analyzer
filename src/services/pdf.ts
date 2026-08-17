// Minimal hand-rolled PDF writer (no dependencies). Produces a single-page
// portrait report card from app-computed stats only.

export function buildReportCardPdf(
  blocks: { rects?: Rect[]; texts?: Text[]; lines?: Line[] }[],
  pageW = 595,
  pageH = 842
): string {
  const header = '%PDF-1.4\n'
  const objs: string[] = []
  objs.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
  objs.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n')
  const content = renderContent(blocks, pageW, pageH)
  objs.push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n`)
  objs.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n')
  objs.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n')
  objs.push(`6 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`)

  let body = ''
  const offsets: number[] = []
  for (const obj of objs) {
    offsets.push(header.length + body.length)
    body += obj
  }
  const xrefStart = header.length + body.length
  const count = objs.length + 1
  let xref = `xref\n0 ${count}\n`
  xref += '0000000000 65535 f \n'
  for (const off of offsets) {
    xref += `${String(off).padStart(10, '0')} 00000 n \n`
  }
  const trailer = `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`
  return header + body + xref + trailer
}

type Rect = { x: number; y: number; w: number; h: number; color?: string }
type Text = { x: number; y: number; s: string; size?: number; bold?: boolean; color?: string; align?: 'left' | 'center' | 'right' }
type Line = { x1: number; y1: number; x2: number; y2: number; color?: string; width?: number }

function renderContent(blocks: { rects?: Rect[]; texts?: Text[]; lines?: Line[] }[], pageW: number, pageH: number): string {
  const ops: string[] = []
  for (const block of blocks) {
    for (const r of block.rects ?? []) {
      ops.push(`${hex(r.color ?? '#FFFFFF')} rg`)
      ops.push(`${r.x} ${pageH - r.y - r.h} ${r.w} ${r.h} re f`)
    }
    for (const l of block.lines ?? []) {
      ops.push(`${hex(l.color ?? '#000000')} RG`)
      ops.push(`${l.width ?? 1} w`)
      ops.push(`${l.x1} ${pageH - l.y1} m ${l.x2} ${pageH - l.y2} l S`)
    }
    for (const t of block.texts ?? []) {
      const size = t.size ?? 10
      ops.push('BT')
      ops.push(`${t.bold ? '/F2' : '/F1'} ${size} Tf`)
      ops.push(`${hex(t.color ?? '#000000')} rg`)
      const text = escapePdf(t.s)
      if (t.align === 'right') {
        const width = approxWidth(t.s, size, !!t.bold)
        ops.push(`${t.x - width} ${pageH - t.y} Td (${text}) Tj`)
      } else {
        ops.push(`${t.x} ${pageH - t.y} Td (${text}) Tj`)
      }
      ops.push('ET')
    }
  }
  return ops.join('\n') + '\n'
}

function hex(color: string): string {
  let c = color.replace('#', '')
  if (c.length === 3) c = c.split('').map((x) => x + x).join('')
  return `${parseInt(c.slice(0, 2), 16) / 255} ${parseInt(c.slice(2, 4), 16) / 255} ${parseInt(c.slice(4, 6), 16) / 255}`
}

// PDF strings must be byte-exact: the writer below emits text as raw bytes via
// charCodeAt & 0xff, so every char must map to a single Latin-1/WinAnsi byte.
const WINANSI: Record<string, string> = {
  '\u2013': '\u0096', // – en dash
  '\u2014': '\u0097', // — em dash
  '\u2018': '\u0091', // ' left single quote
  '\u2019': '\u0092', // ' right single quote
  '\u201c': '\u0093', // " left double quote
  '\u201d': '\u0094', // " right double quote
  '\u2026': '\u0085', // … ellipsis
  '\u2022': '\u0095', // • bullet
  '\u00b7': '\u00b7', // · middle dot (Latin-1)
  '\u00d7': '\u00d7', // ×
  '\u00b0': '\u00b0', // °
  '\u25b2': '^',      // ▲ (not in WinAnsi)
  '\u25bc': 'v',      // ▼ (not in WinAnsi)
  '\u2192': '~',      // → (not in WinAnsi)
}

function toPdfText(s: string): string {
  let out = ''
  for (const ch of s) {
    const mapped = WINANSI[ch]
    if (mapped) {
      out += mapped
    } else if (ch.charCodeAt(0) <= 0xff) {
      out += ch
    } else {
      out += '?'
    }
  }
  return out
}

function escapePdf(s: string): string {
  s = toPdfText(s)
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function approxWidth(s: string, size: number, bold: boolean): number {
  const charW: Record<string, number> = { i: 0.3, l: 0.35, j: 0.35, t: 0.5, f: 0.5, r: 0.55, n: 0.62, m: 0.95, w: 0.95, o: 0.6, e: 0.6, a: 0.6, s: 0.55, d: 0.6, c: 0.55, u: 0.6, h: 0.6, g: 0.6, p: 0.6, q: 0.6, b: 0.6, v: 0.6, x: 0.6, y: 0.6, z: 0.6, k: 0.6 }
  let w = 0
  for (const ch of s) {
    const lc = ch.toLowerCase()
    if (ch === ' ') w += 0.3
    else if (ch >= 'A' && ch <= 'Z') w += bold ? 0.85 : 0.7
    else w += charW[lc] ?? 0.6
  }
  return w * size
}