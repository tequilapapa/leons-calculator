'use client';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function pointLerp(p1, p2, t) {
  return {
    x: lerp(p1.x, p2.x, t),
    y: lerp(p1.y, p2.y, t),
  };
}

function normalizePolygon(polygon) {
  if (!Array.isArray(polygon) || polygon.length !== 4) {
    return [
      { x: 0.18, y: 0.78 },
      { x: 0.82, y: 0.78 },
      { x: 0.92, y: 0.98 },
      { x: 0.08, y: 0.98 },
    ];
  }

  return polygon.map((point) => ({
    x: clamp(Number(point.x ?? 0), 0, 1),
    y: clamp(Number(point.y ?? 0), 0, 1),
  }));
}

function normalizePattern(patternCode) {
  switch (patternCode) {
    case 'random-width':
    case 'herringbone':
    case 'chevron':
    case 'versailles':
    case 'strip':
    case 'block':
      return patternCode;
    default:
      return 'plank';
  }
}

function finishOpacity(finish) {
  switch ((finish || '').toLowerCase()) {
    case 'gloss':
      return 0.82;
    case 'satin':
      return 0.78;
    case 'matte':
    default:
      return 0.74;
  }
}

function finishShine(finish) {
  switch ((finish || '').toLowerCase()) {
    case 'gloss':
      return 0.28;
    case 'satin':
      return 0.18;
    case 'matte':
    default:
      return 0.1;
  }
}

function stainTint(stain) {
  switch ((stain || '').toLowerCase()) {
    case 'light':
      return 'rgba(255, 244, 218, 0.08)';
    case 'golden':
      return 'rgba(214, 169, 74, 0.12)';
    case 'honey':
      return 'rgba(189, 138, 57, 0.14)';
    case 'medium-brown':
      return 'rgba(113, 73, 39, 0.12)';
    case 'dark-walnut':
      return 'rgba(66, 43, 29, 0.18)';
    case 'espresso':
      return 'rgba(42, 28, 22, 0.24)';
    case 'charcoal':
      return 'rgba(32, 32, 36, 0.26)';
    case 'whitewashed':
      return 'rgba(244, 244, 240, 0.16)';
    case 'natural':
    default:
      return 'rgba(255,255,255,0)';
  }
}

function buildBoardMetrics(patternCode) {
  switch (patternCode) {
    case 'strip':
      return { boardWidth: 56, boardLength: 360, gap: 3, angle: 0 };
    case 'random-width':
      return { boardWidth: 120, boardLength: 440, gap: 3, angle: 0 };
    case 'herringbone':
      return { boardWidth: 80, boardLength: 280, gap: 2, angle: 90 };
    case 'chevron':
      return { boardWidth: 84, boardLength: 280, gap: 2, angle: 45 };
    case 'versailles':
      return { boardWidth: 64, boardLength: 240, gap: 2, angle: 0 };
    case 'block':
      return { boardWidth: 46, boardLength: 160, gap: 2, angle: 0 };
    case 'plank':
    default:
      return { boardWidth: 120, boardLength: 480, gap: 3, angle: 0 };
  }
}

function drawBoardImage(ctx, image, dx, dy, dw, dh, rotationRadians = 0) {
  ctx.save();
  ctx.translate(dx + dw / 2, dy + dh / 2);
  ctx.rotate(rotationRadians);
  ctx.drawImage(image, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

function createPatternCanvas({ image, patternCode, stain, finish }) {
  const pattern = normalizePattern(patternCode);
  const metrics = buildBoardMetrics(pattern);

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return canvas;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#151515';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gap = metrics.gap;
  const boardWidth = metrics.boardWidth;
  const boardLength = metrics.boardLength;

  if (pattern === 'plank' || pattern === 'strip') {
    const rowHeight = boardWidth + gap;

    for (let row = 0; row < canvas.height / rowHeight + 2; row += 1) {
      const y = row * rowHeight;
      const offset = row % 2 === 0 ? 0 : Math.round(boardLength * 0.35);

      for (let x = -offset; x < canvas.width + boardLength; x += boardLength + gap) {
        drawBoardImage(ctx, image, x, y, boardLength, boardWidth, 0);

        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, boardLength, boardWidth);
      }
    }
  }

  if (pattern === 'random-width') {
    const widths = [72, 96, 132, 168];
    let y = 0;
    let rowIndex = 0;

    while (y < canvas.height + 160) {
      const dynamicWidth = widths[rowIndex % widths.length];
      const offset = rowIndex % 2 === 0 ? 0 : 150;
      for (let x = -offset; x < canvas.width + 520; x += 420 + gap) {
        drawBoardImage(ctx, image, x, y, 420, dynamicWidth, 0);
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, 420, dynamicWidth);
      }
      y += dynamicWidth + gap;
      rowIndex += 1;
    }
  }

  if (pattern === 'herringbone') {
    const tileSize = 360;
    const bw = 78;
    const bl = 250;

    for (let y = -tileSize; y < canvas.height + tileSize; y += tileSize) {
      for (let x = -tileSize; x < canvas.width + tileSize; x += tileSize) {
        for (let i = 0; i < 2; i += 1) {
          const baseX = x + i * (tileSize / 2);
          const baseY = y;

          drawBoardImage(ctx, image, baseX + 34, baseY + 45, bl, bw, Math.PI / 2);
          drawBoardImage(ctx, image, baseX + 45, baseY + 45, bl, bw, 0);
        }
      }
    }
  }

  if (pattern === 'chevron') {
    const tile = 320;
    const bw = 82;
    const bl = 250;
    const angle = Math.PI / 4;

    for (let y = -tile; y < canvas.height + tile; y += tile) {
      for (let x = -tile; x < canvas.width + tile; x += tile) {
        drawBoardImage(ctx, image, x + 25, y + 82, bl, bw, -angle);
        drawBoardImage(ctx, image, x + 160, y + 82, bl, bw, angle);
      }
    }
  }

  if (pattern === 'block') {
    const tile = 240;
    const bw = 42;
    const bl = 140;

    for (let y = 0; y < canvas.height + tile; y += tile) {
      for (let x = 0; x < canvas.width + tile; x += tile) {
        drawBoardImage(ctx, image, x + 18, y + 20, bl, bw, 0);
        drawBoardImage(ctx, image, x + 18, y + 86, bl, bw, 0);
        drawBoardImage(ctx, image, x + 160, y + 18, bl, bw, Math.PI / 2);
        drawBoardImage(ctx, image, x + 94, y + 18, bl, bw, Math.PI / 2);
      }
    }
  }

  if (pattern === 'versailles') {
    const tile = 420;
    const bw = 38;
    const bl = 160;

    for (let y = -tile; y < canvas.height + tile; y += tile) {
      for (let x = -tile; x < canvas.width + tile; x += tile) {
        ctx.strokeStyle = 'rgba(35,24,16,0.36)';
        ctx.lineWidth = 10;
        ctx.strokeRect(x + 35, y + 35, 310, 310);

        drawBoardImage(ctx, image, x + 58, y + 56, bl, bw, 0);
        drawBoardImage(ctx, image, x + 58, y + 270, bl, bw, 0);
        drawBoardImage(ctx, image, x + 270, y + 58, bl, bw, Math.PI / 2);
        drawBoardImage(ctx, image, x + 56, y + 58, bl, bw, Math.PI / 2);

        drawBoardImage(ctx, image, x + 110, y + 110, 120, 32, Math.PI / 4);
        drawBoardImage(ctx, image, x + 200, y + 110, 120, 32, -Math.PI / 4);
        drawBoardImage(ctx, image, x + 110, y + 200, 120, 32, -Math.PI / 4);
        drawBoardImage(ctx, image, x + 200, y + 200, 120, 32, Math.PI / 4);
      }
    }
  }

  ctx.fillStyle = stainTint(stain);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const shine = finishShine(finish);
  if (shine > 0) {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `rgba(255,255,255,${shine * 0.2})`);
    gradient.addColorStop(0.35, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.7, `rgba(255,255,255,${shine})`);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const darken = ctx.createLinearGradient(0, canvas.height, 0, 0);
  darken.addColorStop(0, 'rgba(0,0,0,0.12)');
  darken.addColorStop(0.45, 'rgba(0,0,0,0)');
  darken.addColorStop(1, 'rgba(255,255,255,0.03)');
  ctx.fillStyle = darken;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return canvas;
}

function resizeCanvasToDisplaySize(canvas) {
  if (!canvas) return false;

  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
  const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }

  return false;
}

function normalizedPolygonToPixels(polygon, width, height) {
  const safePolygon = normalizePolygon(polygon);
  return safePolygon.map((point) => ({
    x: point.x * width,
    y: point.y * height,
  }));
}

function drawProjectedPattern(ctx, patternCanvas, quad, opacity) {
  const strips = 220;

  for (let i = 0; i < strips; i += 1) {
    const t0 = i / strips;
    const t1 = (i + 1) / strips;

    const top0 = pointLerp(quad[0], quad[1], t0);
    const top1 = pointLerp(quad[0], quad[1], t1);
    const bottom0 = pointLerp(quad[3], quad[2], t0);
    const bottom1 = pointLerp(quad[3], quad[2], t1);

    const srcX = patternCanvas.width * t0;
    const srcW = Math.max(1, patternCanvas.width * (t1 - t0));

    const leftHeight = Math.hypot(bottom0.x - top0.x, bottom0.y - top0.y);
    const rightHeight = Math.hypot(bottom1.x - top1.x, bottom1.y - top1.y);
    const avgHeight = Math.max(1, (leftHeight + rightHeight) / 2);

    ctx.save();
    ctx.globalAlpha = opacity;

    ctx.beginPath();
    ctx.moveTo(top0.x, top0.y);
    ctx.lineTo(top1.x, top1.y);
    ctx.lineTo(bottom1.x, bottom1.y);
    ctx.lineTo(bottom0.x, bottom0.y);
    ctx.closePath();
    ctx.clip();

    const angle = Math.atan2(top1.y - top0.y, top1.x - top0.x);
    const stripWidth = Math.max(1, Math.hypot(top1.x - top0.x, top1.y - top0.y));

    ctx.translate(top0.x, top0.y);
    ctx.rotate(angle);
    ctx.transform(
      1,
      0,
      (bottom0.x - top0.x) / Math.max(1, avgHeight),
      (bottom0.y - top0.y) / Math.max(1, avgHeight),
      0,
      0
    );

    ctx.drawImage(
      patternCanvas,
      srcX,
      0,
      srcW,
      patternCanvas.height,
      0,
      0,
      stripWidth + 1,
      avgHeight
    );

    ctx.restore();
  }
}

function drawSpecularPass(ctx, quad, finish) {
  const shine = finishShine(finish);
  if (shine <= 0) return;

  const minX = Math.min(...quad.map((point) => point.x));
  const maxX = Math.max(...quad.map((point) => point.x));
  const minY = Math.min(...quad.map((point) => point.y));
  const maxY = Math.max(...quad.map((point) => point.y));

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(quad[0].x, quad[0].y);
  quad.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.closePath();
  ctx.clip();

  const gradient = ctx.createLinearGradient(minX, minY, maxX, maxY);
  gradient.addColorStop(0, `rgba(255,255,255,${shine * 0.08})`);
  gradient.addColorStop(0.35, 'rgba(255,255,255,0)');
  gradient.addColorStop(0.68, `rgba(255,255,255,${shine * 0.42})`);
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = gradient;
  ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
  ctx.restore();
}

async function loadImage(url) {
  if (!url) return null;

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });
}

export class FloorOverlayEngine {
  constructor({
    canvas,
    video,
    debug = false,
  }) {
    this.canvas = canvas || null;
    this.video = video || null;
    this.debug = Boolean(debug);

    this.profile = null;
    this.patternCode = 'plank';
    this.finish = 'matte';
    this.stain = 'natural';
    this.opacity = 0.76;
    this.floorPolygon = normalizePolygon(null);

    this.textureImage = null;
    this.patternCanvas = null;
    this.patternDirty = true;
    this.running = false;
    this.frameHandle = null;
    this.lastError = null;
  }

  setCanvas(canvas) {
    this.canvas = canvas;
  }

  setVideo(video) {
    this.video = video;
  }

  async setProfile(profile) {
    this.profile = profile || null;
    this.textureImage = null;
    this.patternCanvas = null;
    this.patternDirty = true;

    if (!profile?.albedo_url) {
      return;
    }

    this.textureImage = await loadImage(profile.albedo_url);
    this.finish = profile.finish_type || profile.finish || this.finish;
    this.stain = profile.stain || profile.color || this.stain;
    this.opacity = finishOpacity(this.finish);
  }

  setPattern(patternCode) {
    const nextPattern = normalizePattern(patternCode);
    if (this.patternCode !== nextPattern) {
      this.patternCode = nextPattern;
      this.patternDirty = true;
    }
  }

  setFloorPolygon(polygon) {
    this.floorPolygon = normalizePolygon(polygon);
  }

  setMaterialState({ finish, stain, opacity } = {}) {
    const nextFinish = finish || this.finish;
    const nextStain = stain || this.stain;
    const nextOpacity =
      typeof opacity === 'number' ? clamp(opacity, 0.1, 1) : finishOpacity(nextFinish);

    const changed =
      nextFinish !== this.finish ||
      nextStain !== this.stain ||
      nextOpacity !== this.opacity;

    this.finish = nextFinish;
    this.stain = nextStain;
    this.opacity = nextOpacity;

    if (changed) {
      this.patternDirty = true;
    }
  }

  ensurePatternCanvas() {
    if (!this.textureImage) return;
    if (!this.patternDirty && this.patternCanvas) return;

    this.patternCanvas = createPatternCanvas({
      image: this.textureImage,
      patternCode: this.patternCode,
      stain: this.stain,
      finish: this.finish,
    });

    this.patternDirty = false;
  }

  clear() {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    resizeCanvasToDisplaySize(this.canvas);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawDebugPolygon(ctx, quad) {
    if (!this.debug) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(quad[0].x, quad[0].y);
    quad.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();

    quad.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fill();
    });

    ctx.restore();
  }

  renderOnce() {
    if (!this.canvas || !this.video || !this.textureImage) {
      this.clear();
      return;
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    resizeCanvasToDisplaySize(this.canvas);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.video.readyState < 2) {
      return;
    }

    this.ensurePatternCanvas();
    if (!this.patternCanvas) return;

    const quad = normalizedPolygonToPixels(
      this.floorPolygon,
      this.canvas.width,
      this.canvas.height
    );

    drawProjectedPattern(ctx, this.patternCanvas, quad, this.opacity);
    drawSpecularPass(ctx, quad, this.finish);
    this.drawDebugPolygon(ctx, quad);
  }

  loop = () => {
    if (!this.running) return;

    try {
      this.renderOnce();
    } catch (error) {
      this.lastError = error;
      console.error('FloorOverlayEngine render error:', error);
    }

    this.frameHandle = window.requestAnimationFrame(this.loop);
  };

  start() {
    if (this.running) return;
    this.running = true;
    this.frameHandle = window.requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    if (this.frameHandle) {
      window.cancelAnimationFrame(this.frameHandle);
      this.frameHandle = null;
    }
  }

  destroy() {
    this.stop();
    this.canvas = null;
    this.video = null;
    this.profile = null;
    this.textureImage = null;
    this.patternCanvas = null;
  }
}

export default FloorOverlayEngine;