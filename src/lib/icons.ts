// ============================================
// CYBERBUILD.CA — Icon Renderer
// Draws service icons on OffscreenCanvas/Canvas for Three.js sprites
// Each icon is drawn procedurally in the service's accent color
// ============================================

export type IconType = 'database' | 'appdev' | 'cloud' | 'data' | 'architecture';

export function drawIcon(
  ctx: CanvasRenderingContext2D,
  icon: IconType,
  color: string,
  size: number
): void {
  const cx = size / 2;
  const cy = size / 2;
  const u = size / 12; // unit for proportional sizing

  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (icon) {
    case 'database':
      drawDatabase(ctx, cx, cy, u);
      break;
    case 'appdev':
      drawAppDev(ctx, cx, cy, u);
      break;
    case 'cloud':
      drawCloud(ctx, cx, cy, u);
      break;
    case 'data':
      drawDataEng(ctx, cx, cy, u);
      break;
    case 'architecture':
      drawArchitecture(ctx, cx, cy, u);
      break;
  }
}

function drawDatabase(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  u: number
): void {
  ctx.lineWidth = u * 0.25;
  const dw = u * 2.8;
  const dh = u * 1.0;
  const layers = 3;
  const gap = u * 1.8;

  for (let i = 0; i < layers; i++) {
    const ly = cy - gap + i * gap;
    ctx.beginPath();
    ctx.ellipse(cx, ly, dw, dh, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (i < layers - 1) {
      ctx.beginPath();
      ctx.moveTo(cx - dw, ly);
      ctx.lineTo(cx - dw, ly + gap);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + dw, ly);
      ctx.lineTo(cx + dw, ly + gap);
      ctx.stroke();
    }
  }
}

function drawAppDev(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  u: number
): void {
  ctx.lineWidth = u * 0.3;
  // Left brace {
  ctx.beginPath();
  ctx.moveTo(cx - u * 1.5, cy - u * 3);
  ctx.quadraticCurveTo(cx - u * 2.5, cy - u * 3, cx - u * 2.5, cy - u * 1.5);
  ctx.quadraticCurveTo(cx - u * 2.5, cy - u * 0.5, cx - u * 3.5, cy);
  ctx.quadraticCurveTo(cx - u * 2.5, cy + u * 0.5, cx - u * 2.5, cy + u * 1.5);
  ctx.quadraticCurveTo(cx - u * 2.5, cy + u * 3, cx - u * 1.5, cy + u * 3);
  ctx.stroke();
  // Right brace }
  ctx.beginPath();
  ctx.moveTo(cx + u * 1.5, cy - u * 3);
  ctx.quadraticCurveTo(cx + u * 2.5, cy - u * 3, cx + u * 2.5, cy - u * 1.5);
  ctx.quadraticCurveTo(cx + u * 2.5, cy - u * 0.5, cx + u * 3.5, cy);
  ctx.quadraticCurveTo(cx + u * 2.5, cy + u * 0.5, cx + u * 2.5, cy + u * 1.5);
  ctx.quadraticCurveTo(cx + u * 2.5, cy + u * 3, cx + u * 1.5, cy + u * 3);
  ctx.stroke();
  // Code lines inside
  ctx.lineWidth = u * 0.15;
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 4; i++) {
    const ly = cy - u * 1.2 + i * u * 0.8;
    const lw = u * (1 + Math.random() * 1.5);
    const lx = cx - lw / 2 + u * (Math.random() - 0.5) * 0.5;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + lw, ly);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  u: number
): void {
  ctx.lineWidth = u * 0.26;

  // Back cloud with hatching
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(cx - u * 2.8, cy + u * 1.2);
  ctx.lineTo(cx + u * 2.6, cy + u * 1.2);
  ctx.quadraticCurveTo(cx + u * 3.6, cy + u * 1.2, cx + u * 3.6, cy);
  ctx.quadraticCurveTo(cx + u * 3.6, cy - u * 1.2, cx + u * 2.2, cy - u * 1.5);
  ctx.quadraticCurveTo(cx + u * 1.8, cy - u * 3.2, cx - u * 0.2, cy - u * 2.8);
  ctx.quadraticCurveTo(cx - u * 2.0, cy - u * 3.0, cx - u * 2.5, cy - u * 1.6);
  ctx.quadraticCurveTo(cx - u * 3.8, cy - u * 1.4, cx - u * 3.8, cy - u * 0.1);
  ctx.quadraticCurveTo(cx - u * 3.8, cy + u * 1.2, cx - u * 2.8, cy + u * 1.2);
  ctx.closePath();
  ctx.stroke();

  ctx.lineWidth = u * 0.06;
  ctx.globalAlpha = 0.12;
  for (let i = -8; i < 9; i++) {
    const hy = cy + i * u * 0.35;
    ctx.beginPath();
    ctx.moveTo(cx - u * 3.2, hy);
    ctx.lineTo(cx + u * 3.2, hy);
    ctx.stroke();
  }

  // Front cloud
  ctx.globalAlpha = 1;
  ctx.lineWidth = u * 0.28;
  ctx.beginPath();
  ctx.moveTo(cx - u * 2.2, cy + u * 1.5);
  ctx.lineTo(cx + u * 2.0, cy + u * 1.5);
  ctx.quadraticCurveTo(cx + u * 3.0, cy + u * 1.5, cx + u * 3.0, cy + u * 0.4);
  ctx.quadraticCurveTo(cx + u * 3.0, cy - u * 0.8, cx + u * 1.6, cy - u * 1.0);
  ctx.quadraticCurveTo(cx + u * 1.2, cy - u * 2.4, cx - u * 0.3, cy - u * 2.0);
  ctx.quadraticCurveTo(cx - u * 1.6, cy - u * 2.2, cx - u * 2.0, cy - u * 0.9);
  ctx.quadraticCurveTo(cx - u * 3.2, cy - u * 0.7, cx - u * 3.2, cy + u * 0.3);
  ctx.quadraticCurveTo(cx - u * 3.2, cy + u * 1.5, cx - u * 2.2, cy + u * 1.5);
  ctx.closePath();
  ctx.stroke();

  // Inner cloud accent
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = u * 0.16;
  ctx.beginPath();
  ctx.moveTo(cx - u * 1.2, cy + u * 1.0);
  ctx.quadraticCurveTo(cx - u * 1.8, cy + u * 1.0, cx - u * 1.8, cy + u * 0.3);
  ctx.quadraticCurveTo(cx - u * 1.8, cy - u * 0.3, cx - u * 1.0, cy - u * 0.3);
  ctx.quadraticCurveTo(cx - u * 0.5, cy - u * 0.9, cx + u * 0.4, cy - u * 0.5);
  ctx.quadraticCurveTo(cx + u * 1.0, cy - u * 0.3, cx + u * 1.0, cy + u * 0.2);
  ctx.quadraticCurveTo(cx + u * 1.0, cy + u * 1.0, cx + u * 0.3, cy + u * 1.0);
  ctx.closePath();
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawDataEng(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  u: number
): void {
  // Half-gear left + circuit traces right
  const gcx = cx - u * 1.2;
  const gcy = cy;
  ctx.lineWidth = u * 0.28;

  const gOuter = u * 2.3;
  const gInner = u * 1.7;
  ctx.beginPath();
  ctx.moveTo(gcx + u * 0.3, gcy + gInner);
  const numTeeth = 5;
  for (let i = 0; i < numTeeth; i++) {
    const ang = Math.PI * 0.6 + (i / numTeeth) * (Math.PI * 1.3);
    const midA = Math.PI * 0.6 + ((i + 0.5) / numTeeth) * (Math.PI * 1.3);
    ctx.lineTo(gcx + Math.cos(ang) * gInner, gcy + Math.sin(ang) * gInner);
    ctx.lineTo(gcx + Math.cos(ang + 0.1) * gOuter, gcy + Math.sin(ang + 0.1) * gOuter);
    ctx.lineTo(gcx + Math.cos(midA) * gOuter, gcy + Math.sin(midA) * gOuter);
    ctx.lineTo(gcx + Math.cos(midA + 0.1) * gInner, gcy + Math.sin(midA + 0.1) * gInner);
  }
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(gcx, gcy, u * 1.05, Math.PI * 0.55, Math.PI * 1.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(gcx, gcy, u * 0.35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(gcx, gcy, u * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // Circuit traces
  ctx.lineWidth = u * 0.16;
  const traceStartX = gcx + u * 1.1;
  const traceData = [
    { dy: -u * 2.0, endX: cx + u * 3.8, nodes: 2 },
    { dy: -u * 1.0, endX: cx + u * 4.2, nodes: 3 },
    { dy: 0, endX: cx + u * 3.5, nodes: 2 },
    { dy: u * 1.0, endX: cx + u * 4.0, nodes: 3 },
    { dy: u * 2.0, endX: cx + u * 3.2, nodes: 2 },
  ];

  traceData.forEach((tr) => {
    const sy = gcy + tr.dy;
    ctx.beginPath();
    ctx.moveTo(traceStartX, sy);
    ctx.lineTo(tr.endX, sy);
    ctx.stroke();

    const spacing = (tr.endX - traceStartX) / (tr.nodes + 1);
    for (let n = 1; n <= tr.nodes; n++) {
      const nx = traceStartX + spacing * n;
      ctx.beginPath();
      ctx.arc(nx, sy, u * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawArchitecture(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  u: number
): void {
  const lx = cx;
  const ly = cy - u * 1.2;
  const bR = u * 1.3;

  // === LIGHTBULB — yellow/white with warm glow ===
  const bulbColor = '#ffe066';
  const glowColor = '#ffdd44';

  // Outer glow halo
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = u * 3;
  ctx.strokeStyle = bulbColor;
  ctx.lineWidth = u * 0.22;

  // Bulb outline
  ctx.beginPath();
  ctx.moveTo(lx - u * 0.45, ly + bR * 0.9);
  ctx.quadraticCurveTo(lx - bR * 0.85, ly + bR * 0.3, lx - bR, ly - u * 0.3);
  ctx.arc(lx, ly - u * 0.3, bR, Math.PI, 0, false);
  ctx.quadraticCurveTo(lx + bR * 0.85, ly + bR * 0.3, lx + u * 0.45, ly + bR * 0.9);
  ctx.lineTo(lx - u * 0.45, ly + bR * 0.9);
  ctx.stroke();

  // Inner fill glow (subtle warm wash)
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#ffee88';
  ctx.fill();
  ctx.globalAlpha = 1;

  // Screw base — warm white
  ctx.lineWidth = u * 0.16;
  ctx.beginPath(); ctx.moveTo(lx - u * 0.4, ly + bR * 1.05); ctx.lineTo(lx + u * 0.4, ly + bR * 1.05); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(lx - u * 0.3, ly + bR * 1.2); ctx.lineTo(lx + u * 0.3, ly + bR * 1.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(lx - u * 0.15, ly + bR * 1.32); ctx.lineTo(lx + u * 0.15, ly + bR * 1.32); ctx.stroke();

  // Puzzle divisions inside bulb — softer yellow
  ctx.strokeStyle = '#ffdd88';
  ctx.lineWidth = u * 0.12;
  ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.moveTo(lx, ly - u * 0.3 - bR * 0.85); ctx.lineTo(lx, ly + bR * 0.55); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(lx - bR * 0.55, ly);
  ctx.lineTo(lx - u * 0.25, ly);
  ctx.quadraticCurveTo(lx - u * 0.25, ly - u * 0.22, lx, ly - u * 0.22);
  ctx.quadraticCurveTo(lx + u * 0.25, ly - u * 0.22, lx + u * 0.25, ly);
  ctx.lineTo(lx + bR * 0.55, ly);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Rays — bright warm glow
  ctx.strokeStyle = bulbColor;
  ctx.shadowBlur = u * 2;
  ctx.lineWidth = u * 0.15;
  const rays = 6;
  for (let i = 0; i < rays; i++) {
    const a = -Math.PI * 0.8 + (i / (rays - 1)) * Math.PI * 0.6;
    const rx = lx + Math.cos(a) * (bR + u * 0.4);
    const ry = ly - u * 0.3 + Math.sin(a) * (bR + u * 0.4);
    const rx2 = lx + Math.cos(a) * (bR + u * 0.9);
    const ry2 = ly - u * 0.3 + Math.sin(a) * (bR + u * 0.9);
    ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx2, ry2); ctx.stroke();
  }

  ctx.restore(); // Back to service color + default shadow

  // === HIERARCHY TREE below — stays in service color ===
  const ty = cy + u * 2.2;
  ctx.lineWidth = u * 0.18;
  ctx.beginPath(); ctx.moveTo(lx, ly + bR * 1.35); ctx.lineTo(lx, ty); ctx.stroke();

  const boxW = u * 1.0;
  const boxH = u * 0.7;
  const boxes = [-u * 2.2, 0, u * 2.2];
  ctx.beginPath(); ctx.moveTo(lx + boxes[0], ty + boxH / 2); ctx.lineTo(lx + boxes[2], ty + boxH / 2); ctx.stroke();

  boxes.forEach((bx) => {
    ctx.beginPath(); ctx.moveTo(lx + bx, ty + boxH / 2); ctx.lineTo(lx + bx, ty + boxH); ctx.stroke();
    ctx.strokeRect(lx + bx - boxW / 2, ty + boxH, boxW, boxH);
  });
}