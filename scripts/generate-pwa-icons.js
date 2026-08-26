const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generateIconPNG(size, isMaskable = false) {
  // Build RGBA bitmap
  const width = size;
  const height = size;
  const stride = width * 4;
  const rawData = Buffer.alloc((stride + 1) * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = size * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawData[rowOffset] = 0; // filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default Background: Deep Slate Navy (#07090E)
      let r = 7, g = 9, b = 14, a = 255;

      // Rounded rect or circle badge
      const cornerRadius = size * 0.22;
      const inRoundedRect =
        x >= cornerRadius && x <= width - cornerRadius && y >= 0 && y <= height ||
        y >= cornerRadius && y <= height - cornerRadius && x >= 0 && x <= width ||
        Math.hypot(x - cornerRadius, y - cornerRadius) <= cornerRadius ||
        Math.hypot(x - (width - cornerRadius), y - cornerRadius) <= cornerRadius ||
        Math.hypot(x - cornerRadius, y - (height - cornerRadius)) <= cornerRadius ||
        Math.hypot(x - (width - cornerRadius), y - (height - cornerRadius)) <= cornerRadius;

      if (!isMaskable && !inRoundedRect) {
        a = 0; // transparent corner for standard icon
      } else {
        // Inner gradient background
        const gradT = (x + y) / (width + height);
        r = Math.round(13 + gradT * 9);
        g = Math.round(17 + gradT * 10);
        b = Math.round(23 + gradT * 11);

        // Circular electric cyan / blue border ring
        if (Math.abs(dist - radius) < size * 0.028) {
          r = 6; g = 182; b = 212; // #06B6D4 cyan
        }

        // Draw Bus shape in center
        // Bus body coordinates
        const busW = size * 0.48;
        const busH = size * 0.52;
        const busLeft = cx - busW / 2;
        const busRight = cx + busW / 2;
        const busTop = cy - busH / 2 - size * 0.02;
        const busBottom = busTop + busH;

        if (x >= busLeft && x <= busRight && y >= busTop && y <= busBottom) {
          // Bus Main Body: Vibrant Red (#E30613) with gradient
          const busGrad = (y - busTop) / busH;
          r = Math.round(227 - busGrad * 20);
          g = Math.round(6 + busGrad * 10);
          b = Math.round(19 + busGrad * 20);

          // Bus Windshield
          const wsLeft = busLeft + busW * 0.1;
          const wsRight = busRight - busW * 0.1;
          const wsTop = busTop + busH * 0.12;
          const wsBottom = busTop + busH * 0.45;
          if (x >= wsLeft && x <= wsRight && y >= wsTop && y <= wsBottom) {
            // Cyan-tinted dark glass
            r = 15; g = 23; b = 42;
            if (y > wsTop && y < wsTop + size * 0.015) {
              r = 56; g = 189; b = 248; // reflection
            }
          }

          // Headlights (golden yellow)
          const hlY = busTop + busH * 0.72;
          const hlLeftX = busLeft + busW * 0.18;
          const hlRightX = busRight - busW * 0.18;
          const hlR = size * 0.04;
          if (Math.hypot(x - hlLeftX, y - hlY) <= hlR || Math.hypot(x - hlRightX, y - hlY) <= hlR) {
            r = 250; g = 204; b = 21; // #FACC15
          }

          // Grille lines
          const grY1 = busTop + busH * 0.72;
          const grY2 = busTop + busH * 0.82;
          if (x >= cx - busW * 0.18 && x <= cx + busW * 0.18) {
            if (Math.abs(y - grY1) <= 1.5 || Math.abs(y - grY2) <= 1.5) {
              r = 255; g = 255; b = 255;
            }
          }
        }

        // Bus Wheels
        const wheelY = busBottom;
        const wheelW = size * 0.09;
        const wheelH = size * 0.07;
        const w1X = busLeft + busW * 0.08;
        const w2X = busRight - busW * 0.08 - wheelW;
        if (
          (x >= w1X && x <= w1X + wheelW && y >= wheelY && y <= wheelY + wheelH) ||
          (x >= w2X && x <= w2X + wheelW && y >= wheelY && y <= wheelY + wheelH)
        ) {
          r = 30; g = 41; b = 59;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Deflate IDAT
  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type 6: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate all standard PWA icon formats
console.log('Generating PWA icons...');
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), generateIconPNG(192, false));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), generateIconPNG(512, false));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable.png'), generateIconPNG(512, true));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), generateIconPNG(180, false));
fs.writeFileSync(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'), generateIconPNG(180, false));
console.log('PWA icons created successfully!');
