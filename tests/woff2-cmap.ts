import { readFileSync } from "node:fs";
import { brotliDecompressSync } from "node:zlib";

/** Code points a .woff2 maps to a glyph (cmap format 4 and 12). cmap is never transformed in WOFF2, so the brotli stream is read as is. */
export function cmapOf(path: string): Set<number> {
  const buf = readFileSync(path);
  const numTables = buf.readUInt16BE(12);
  const compressedSize = buf.readUInt32BE(20);
  let pos = 48;
  const base128 = () => { let n = 0; for (;;) { const b = buf[pos++]; n = n * 128 + (b & 0x7f); if (!(b & 0x80)) return n; } };
  let offset = 0;
  let cmap: { start: number; length: number } | null = null;
  for (let i = 0; i < numTables; i++) {
    const flags = buf[pos++];
    const tag = (flags & 0x3f) === 0x3f ? (pos += 4, buf.toString("latin1", pos - 4, pos)) : KNOWN[flags & 0x3f];
    const length = base128();
    const transformed = tag === "glyf" || tag === "loca" ? ((flags >> 6) & 3) === 0 : ((flags >> 6) & 3) !== 0;
    const stored = transformed ? base128() : length;
    if (tag === "cmap") cmap = { start: offset, length: stored };
    offset += stored;
  }
  if (!cmap) throw new Error(`${path}: no cmap`);
  const data = brotliDecompressSync(buf.subarray(pos, pos + compressedSize)).subarray(cmap.start, cmap.start + cmap.length);
  const out = new Set<number>();
  for (let i = 0; i < data.readUInt16BE(2); i++) {
    const t = data.readUInt32BE(4 + i * 8 + 4);
    const format = data.readUInt16BE(t);
    if (format === 4) {
      const segs = data.readUInt16BE(t + 6) / 2;
      const ends = t + 14, starts = ends + segs * 2 + 2, deltas = starts + segs * 2, ranges = deltas + segs * 2;
      for (let s = 0; s < segs; s++) {
        const [end, start] = [data.readUInt16BE(ends + s * 2), data.readUInt16BE(starts + s * 2)];
        for (let c = start; c <= end && c < 0xffff; c++) {
          const ro = data.readUInt16BE(ranges + s * 2);
          const gid = ro === 0 ? (c + data.readUInt16BE(deltas + s * 2)) & 0xffff : data.readUInt16BE(ranges + s * 2 + ro + (c - start) * 2);
          if (gid) out.add(c);
        }
      }
    } else if (format === 12) {
      for (let g = 0; g < data.readUInt32BE(t + 12); g++) {
        const at = t + 16 + g * 12;
        for (let c = data.readUInt32BE(at); c <= data.readUInt32BE(at + 4); c++) out.add(c);
      }
    }
  }
  return out;
}

// WOFF2 known table tags by 6-bit flag value (spec section 5.1)
const KNOWN = ["cmap","head","hhea","hmtx","maxp","name","OS/2","post","cvt ","fpgm","glyf","loca","prep","CFF ","VORG","EBDT","EBLC","gasp","hdmx","kern","LTSH","PCLT","VDMX","vhea","vmtx","BASE","GDEF","GPOS","GSUB","EBSC","JSTF","MATH","CBDT","CBLC","COLR","CPAL","SVG ","sbix","acnt","avar","bdat","bloc","bsln","cvar","fdsc","feat","fmtx","fvar","gvar","hsty","just","lcar","mort","morx","opbd","prop","trak","Zapf","Silf","Glat","Gloc","Feat","Sill"];
