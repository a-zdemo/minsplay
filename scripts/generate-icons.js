import fs from "fs";
import path from "path";
import zlib from "zlib";

// Standard CRC32 calculation for valid PNG chunks
function makeCRCTable() {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = makeCRCTable();

function crc32(buf) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Distance from point to line segment (capsule rasterization for legs & antennae)
function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Rotated ellipse test
function inRotatedEllipse(px, py, cx, cy, rx, ry, angleRad) {
  const cos = Math.cos(-angleRad);
  const sin = Math.sin(-angleRad);
  const dx = px - cx;
  const dy = py - cy;
  const rxLocal = dx * cos - dy * sin;
  const ryLocal = dx * sin + dy * cos;
  return (rxLocal * rxLocal) / (rx * rx) + (ryLocal * ryLocal) / (ry * ry) <= 1.0;
}

// Rounded rectangle test
function inRoundedRect(px, py, x, y, w, h, r) {
  if (px < x || px > x + w || py < y || py > y + h) return false;
  if (px >= x + r && px <= x + w - r) return true;
  if (py >= y + r && py <= y + h - r) return true;
  const dx = px < x + r ? px - (x + r) : px - (x + w - r);
  const dy = py < y + r ? py - (y + r) : py - (y + h - r);
  return dx * dx + dy * dy <= r * r;
}

// Triangle test (Play glyph)
function inTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  const area = 0.5 * (-y2 * x3 + y1 * (-x2 + x3) + x1 * (y2 - y3) + x2 * y3);
  const s = 1 / (2 * area) * (y1 * x3 - x1 * y3 + (y3 - y1) * px + (x1 - x3) * py);
  const t = 1 / (2 * area) * (x1 * y2 - y1 * x2 + (y1 - y2) * px + (x2 - x1) * py);
  return s >= 0 && t >= 0 && 1 - s - t >= 0;
}

// Procedural rasterizer rendering the Ant Carrying Play Button (192 & 512)
function generateAntMascotPNG(size) {
  const width = size;
  const height = size;
  const scale = size / 512;
  const rawData = Buffer.alloc((width * 4 + 1) * height);

  const cx = width / 2;
  const cy = height / 2;
  const badgeRadius = 236 * scale;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    rawData[rowOffset] = 0; // PNG filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const distBadge = Math.hypot(dx, dy);

      // Outside badge circle -> Canvas background (#0a0a0e)
      if (distBadge > badgeRadius) {
        rawData[pxOffset] = 10;
        rawData[pxOffset + 1] = 10;
        rawData[pxOffset + 2] = 14;
        rawData[pxOffset + 3] = 255;
        continue;
      }

      // Base badge color: White with soft top-to-bottom shading
      let r = 248 - Math.floor((y / height) * 16);
      let g = 248 - Math.floor((y / height) * 16);
      let b = 252 - Math.floor((y / height) * 12);
      let a = 255;

      // Outer badge stroke
      if (distBadge >= badgeRadius - 6 * scale) {
        r = 220; g = 220; b = 230;
      }

      // Ground Shadow
      const shadowDist = Math.hypot((x - 256 * scale) / (135 * scale), (y - 396 * scale) / (18 * scale));
      if (shadowDist <= 1.0) {
        const shadowAlpha = (1.0 - shadowDist) * 0.32;
        r = Math.floor(r * (1 - shadowAlpha) + 18 * shadowAlpha);
        g = Math.floor(g * (1 - shadowAlpha) + 18 * shadowAlpha);
        b = Math.floor(b * (1 - shadowAlpha) + 28 * shadowAlpha);
      }

      // Legs (Jointed segments)
      const legThickness = 5.2 * scale;
      const isLeg =
        distToSegment(x, y, 175 * scale, 320 * scale, 130 * scale, 385 * scale) <= legThickness ||
        distToSegment(x, y, 235 * scale, 295 * scale, 210 * scale, 388 * scale) <= legThickness ||
        distToSegment(x, y, 260 * scale, 290 * scale, 298 * scale, 386 * scale) <= legThickness ||
        distToSegment(x, y, 258 * scale, 296 * scale, 276 * scale, 392 * scale) <= legThickness ||
        distToSegment(x, y, 195 * scale, 315 * scale, 168 * scale, 390 * scale) <= legThickness ||
        distToSegment(x, y, 252 * scale, 280 * scale, 325 * scale, 248 * scale) <= legThickness ||
        distToSegment(x, y, 325 * scale, 248 * scale, 356 * scale, 234 * scale) <= legThickness;

      if (isLeg) {
        r = 28; g = 28; b = 36;
      }

      // Antennae
      const isAntenna =
        distToSegment(x, y, 292 * scale, 198 * scale, 262 * scale, 138 * scale) <= 3.2 * scale ||
        distToSegment(x, y, 306 * scale, 195 * scale, 330 * scale, 134 * scale) <= 3.2 * scale;
      if (isAntenna) {
        r = 28; g = 28; b = 36;
      }

      // Ant Abdomen
      if (inRotatedEllipse(x, y, 160 * scale, 310 * scale, 64 * scale, 48 * scale, -0.42)) {
        r = 30; g = 30; b = 38;
      }

      // Ant Thorax
      if (inRotatedEllipse(x, y, 238 * scale, 285 * scale, 38 * scale, 30 * scale, -0.26)) {
        r = 34; g = 34; b = 44;
      }

      // Ant Head
      if (inRotatedEllipse(x, y, 304 * scale, 225 * scale, 36 * scale, 32 * scale, -0.31)) {
        r = 38; g = 38; b = 48;
      }

      // Eye
      const eyeDist = Math.hypot((x - 318 * scale) / (10 * scale), (y - 214 * scale) / (12 * scale));
      if (eyeDist <= 1.0) {
        r = 12; g = 12; b = 16;
        // Pupil catchlight
        if (Math.hypot(x - 320 * scale, y - 211 * scale) <= 3.8 * scale) {
          r = 255; g = 255; b = 255;
        }
      }

      // Hot Pink Play Button Tile (312, 148, 132, 124, r=26)
      if (inRoundedRect(x, y, 312 * scale, 148 * scale, 132 * scale, 124 * scale, 26 * scale)) {
        r = 255; g = 46; b = 99; // #ff2e63

        // Play Triangle (▶)
        const inPlay = inTriangle(
          x, y,
          346 * scale, 188 * scale,
          346 * scale, 232 * scale,
          384 * scale, 210 * scale
        );

        // Pause Bars (❚❚)
        const inPause1 =
          x >= 396 * scale && x <= 404 * scale &&
          y >= 188 * scale && y <= 232 * scale;
        const inPause2 =
          x >= 412 * scale && x <= 420 * scale &&
          y >= 188 * scale && y <= 232 * scale;

        if (inPlay || inPause1 || inPause2) {
          r = 255; g = 255; b = 255;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = createChunk("IHDR", ihdr);
  const idatChunk = createChunk("IDAT", zlib.deflateSync(rawData));
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

const targetDir = path.resolve("./public/icons");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(path.join(targetDir, "icon-192.png"), generateAntMascotPNG(192));
fs.writeFileSync(path.join(targetDir, "icon-512.png"), generateAntMascotPNG(512));

console.log("Minsplay: Successfully generated 192x192 & 512x512 Ant Mascot PWA icons in public/icons/");


