import fs from 'fs';
import path from 'path';

// Let's inspect the webp files in node using a quick probe of non-transparent pixel bounds
// Or we can check if sharp or canvas is available
try {
  const sharp = (await import('sharp')).default;
  for (const f of ['hubie-stand.webp', 'hubie-crouch.webp', 'hubie-jump.webp', 'hubie-land.webp', 'hubie-celebrate.webp', 'hubie-scared.webp', 'hubie-fall.webp']) {
    const p = path.join('web', 'assets', 'hubie_halloween', f);
    const meta = await sharp(p).metadata();
    const { data, info } = await sharp(p).raw().toBuffer({ resolveWithObject: true });
    
    // Find minX, maxX, minY, maxY
    let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const idx = (y * info.width + x) * info.channels;
        const alpha = info.channels === 4 ? data[idx + 3] : 255;
        if (alpha > 20) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    console.log(f, `${info.width}x${info.height}`, `bounds: [${minX}, ${minY}] to [${maxX}, ${maxY}], w=${maxX - minX}, h=${maxY - minY}, footCenter=${((minX + maxX)/2 / info.width).toFixed(4)}`);
  }
} catch (e) {
  console.log('Sharp not installed or error:', e.message);
}

