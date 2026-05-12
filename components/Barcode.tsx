/**
 * A QR code component that encodes a URL as an inline SVG.
 *
 * Uses a minimal QR code matrix generator (no external deps).
 * For short URLs (< 50 chars), this produces a Version 2-3 QR code
 * that's scannable by any phone camera.
 *
 * Renders as an inline SVG so html-to-image captures it perfectly
 * in the downloaded PNG.
 */

type Props = {
  url: string;
  size?: number;
  className?: string;
};

export default function Barcode({ url, size = 80, className }: Props) {
  const matrix = generateQR(url);
  const moduleCount = matrix.length;
  const cellSize = size / (moduleCount + 2); // +2 for quiet zone

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      aria-label={`QR code for ${url}`}
      role="img"
    >
      {/* Background */}
      <rect width={size} height={size} fill="transparent" />
      {/* Modules */}
      {matrix.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${x}-${y}`}
              x={(x + 1) * cellSize}
              y={(y + 1) * cellSize}
              width={cellSize}
              height={cellSize}
              fill="currentColor"
            />
          ) : null
        )
      )}
    </svg>
  );
}

// ============================================================
// Minimal QR Code Generator (Version 1-4, Byte mode, Level L)
// Based on the QR code spec ISO/IEC 18004
// This is intentionally minimal — handles short ASCII URLs only.
// ============================================================

function generateQR(data: string): boolean[][] {
  const bytes = new TextEncoder().encode(data);
  const version = getMinVersion(bytes.length);
  const size = version * 4 + 17;

  // Create module grid
  const modules: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  // Place function patterns
  placeFinders(modules, isFunction, size);
  placeAlignments(modules, isFunction, version, size);
  placeTimingPatterns(modules, isFunction, size);
  modules[size - 8][8] = true; // Dark module
  isFunction[size - 8][8] = true;

  // Reserve format info areas
  reserveFormatAreas(isFunction, size);

  // Encode data
  const encoded = encodeData(bytes, version);

  // Place data bits
  placeData(modules, isFunction, encoded, size);

  // Apply mask (mask 0 for simplicity) and format info
  applyMask(modules, isFunction, size, 0);
  placeFormatInfo(modules, size, 0);

  return modules.map((row) => row.map((cell) => cell === true));
}

function getMinVersion(byteLen: number): number {
  // Byte mode capacities at Error Correction Level L
  const caps = [0, 17, 32, 53, 78]; // versions 1-4
  for (let v = 1; v <= 4; v++) {
    if (byteLen <= caps[v]) return v;
  }
  return 4; // fallback
}

function placeFinders(
  m: (boolean | null)[][],
  f: boolean[][],
  size: number
) {
  const positions = [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ];
  for (const [row, col] of positions) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r;
        const cc = col + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const inOuter =
          r === 0 || r === 6 || c === 0 || c === 6;
        const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        m[rr][cc] = (r >= 0 && r <= 6 && c >= 0 && c <= 6) &&
          (inOuter || inInner);
        f[rr][cc] = true;
      }
    }
  }
}

function placeAlignments(
  m: (boolean | null)[][],
  f: boolean[][],
  version: number,
  size: number
) {
  if (version < 2) return;
  const positions = getAlignmentPositions(version, size);
  for (const row of positions) {
    for (const col of positions) {
      if (f[row][col]) continue; // skip if overlaps finder
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const val =
            Math.abs(r) === 2 ||
            Math.abs(c) === 2 ||
            (r === 0 && c === 0);
          m[row + r][col + c] = val;
          f[row + r][col + c] = true;
        }
      }
    }
  }
}

function getAlignmentPositions(version: number, size: number): number[] {
  if (version === 1) return [];
  const last = size - 7;
  if (version <= 6) return [6, last];
  // For larger versions (not needed for our use case but safe)
  return [6, last];
}

function placeTimingPatterns(
  m: (boolean | null)[][],
  f: boolean[][],
  size: number
) {
  for (let i = 8; i < size - 8; i++) {
    if (!f[6][i]) {
      m[6][i] = i % 2 === 0;
      f[6][i] = true;
    }
    if (!f[i][6]) {
      m[i][6] = i % 2 === 0;
      f[i][6] = true;
    }
  }
}

function reserveFormatAreas(f: boolean[][], size: number) {
  for (let i = 0; i < 8; i++) {
    f[8][i] = true;
    f[8][size - 1 - i] = true;
    f[i][8] = true;
    f[size - 1 - i][8] = true;
  }
  f[8][8] = true;
}

function encodeData(bytes: Uint8Array, version: number): boolean[] {
  const totalCodewords = getTotalCodewords(version);
  const ecCodewords = getECCodewords(version);
  const dataCodewords = totalCodewords - ecCodewords;

  const bits: boolean[] = [];

  // Mode indicator: 0100 (byte mode)
  pushBits(bits, 0b0100, 4);

  // Character count (8 bits for v1-9 byte mode)
  pushBits(bits, bytes.length, version <= 9 ? 8 : 16);

  // Data bytes
  for (const b of bytes) {
    pushBits(bits, b, 8);
  }

  // Terminator
  const remaining = dataCodewords * 8 - bits.length;
  pushBits(bits, 0, Math.min(4, remaining));

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(false);

  // Pad codewords
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < dataCodewords * 8) {
    pushBits(bits, padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert to codewords
  const dataWords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let val = 0;
    for (let j = 0; j < 8; j++) {
      val = (val << 1) | (bits[i + j] ? 1 : 0);
    }
    dataWords.push(val);
  }

  // Generate EC codewords using Reed-Solomon
  const ecWords = generateEC(dataWords, ecCodewords);

  // Combine and convert to bit array
  const allWords = [...dataWords, ...ecWords];
  const result: boolean[] = [];
  for (const w of allWords) {
    for (let i = 7; i >= 0; i--) {
      result.push(((w >> i) & 1) === 1);
    }
  }

  return result;
}

function pushBits(arr: boolean[], value: number, count: number) {
  for (let i = count - 1; i >= 0; i--) {
    arr.push(((value >> i) & 1) === 1);
  }
}

function getTotalCodewords(version: number): number {
  const table = [0, 26, 44, 70, 100];
  return table[version] ?? 26;
}

function getECCodewords(version: number): number {
  // Level L EC codewords
  const table = [0, 7, 10, 15, 20];
  return table[version] ?? 7;
}

// Simplified Reed-Solomon over GF(256)
function generateEC(data: number[], ecCount: number): number[] {
  const gf256Exp = new Uint8Array(256);
  const gf256Log = new Uint8Array(256);
  let val = 1;
  for (let i = 0; i < 255; i++) {
    gf256Exp[i] = val;
    gf256Log[val] = i;
    val = val * 2;
    if (val >= 256) val ^= 0x11d;
  }
  gf256Exp[255] = gf256Exp[0];

  const gfMul = (a: number, b: number) => {
    if (a === 0 || b === 0) return 0;
    return gf256Exp[(gf256Log[a] + gf256Log[b]) % 255];
  };

  // Build generator polynomial
  let gen = [1];
  for (let i = 0; i < ecCount; i++) {
    const newGen = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      newGen[j] ^= gen[j];
      newGen[j + 1] ^= gfMul(gen[j], gf256Exp[i]);
    }
    gen = newGen;
  }

  // Polynomial division
  const msg = [...data, ...new Array(ecCount).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 1; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }

  return msg.slice(data.length);
}

function placeData(
  m: (boolean | null)[][],
  f: boolean[][],
  bits: boolean[],
  size: number
) {
  let bitIdx = 0;
  let upward = true;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // skip timing pattern column
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rows) {
      for (const col of [right, right - 1]) {
        if (col < 0) continue;
        if (f[row][col]) continue;
        m[row][col] = bitIdx < bits.length ? bits[bitIdx] : false;
        bitIdx++;
      }
    }
    upward = !upward;
  }
}

function applyMask(
  m: (boolean | null)[][],
  f: boolean[][],
  size: number,
  mask: number
) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (f[r][c]) continue;
      let shouldFlip = false;
      switch (mask) {
        case 0:
          shouldFlip = (r + c) % 2 === 0;
          break;
        case 1:
          shouldFlip = r % 2 === 0;
          break;
        default:
          shouldFlip = (r + c) % 2 === 0;
      }
      if (shouldFlip) {
        m[r][c] = !m[r][c];
      }
    }
  }
}

function placeFormatInfo(
  m: (boolean | null)[][],
  size: number,
  mask: number
) {
  // Format info for Level L, mask 0 = 0x77C4 after BCH
  // Pre-computed format strings for L level, masks 0-7
  const formatBits = [
    0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976,
  ];
  const info = formatBits[mask] ?? formatBits[0];

  for (let i = 0; i < 15; i++) {
    const bit = ((info >> (14 - i)) & 1) === 1;

    // Around top-left finder
    if (i < 6) {
      m[8][i] = bit;
    } else if (i === 6) {
      m[8][7] = bit;
    } else if (i === 7) {
      m[8][8] = bit;
    } else if (i === 8) {
      m[7][8] = bit;
    } else {
      m[14 - i][8] = bit;
    }

    // Other copy
    if (i < 8) {
      m[size - 1 - i][8] = bit;
    } else {
      m[8][size - 15 + i] = bit;
    }
  }
}
