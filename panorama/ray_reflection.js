"use strict";

const fs = require("node:fs");

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1]];
}

function add(a, b) {
  return [a[0] + b[0], a[1] + b[1]];
}

function mul(a, s) {
  return [a[0] * s, a[1] * s];
}

function norm(a) {
  return Math.hypot(a[0], a[1]);
}

function normalize(a, eps = 1e-12) {
  const n = norm(a);
  if (n < eps) {
    throw new Error("Vetor diretor nulo.");
  }
  return [a[0] / n, a[1] / n];
}

function parseCircle(circle) {
  // Aceita { center: [cx, cy], r } ou [[cx, cy], r].
  if (Array.isArray(circle) && circle.length === 2 && Array.isArray(circle[0])) {
    return { center: circle[0], r: circle[1] };
  }

  if (circle && Array.isArray(circle.center) && typeof circle.r === "number") {
    return { center: circle.center, r: circle.r };
  }

  throw new Error("Circulo invalido. Use {center:[x,y], r} ou [[x,y], r].");
}

function normalizeBox(box) {
  if (!box) {
    return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  }

  const minX = box.minX ?? 0;
  const minY = box.minY ?? 0;
  const maxX = box.maxX ?? 1;
  const maxY = box.maxY ?? 1;

  if (!(maxX > minX) || !(maxY > minY)) {
    throw new Error("Caixa invalida para o toro.");
  }

  return { minX, minY, maxX, maxY };
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toFixed3(x) {
  return Number(x).toFixed(3);
}

function buildOpenArrowPath(pFrom, pTo, placement, size, spread) {
  const vx = pTo[0] - pFrom[0];
  const vy = pTo[1] - pFrom[1];
  const len = Math.hypot(vx, vy);
  if (len < 1e-12) return "";

  const tx = vx / len;
  const ty = vy / len;
  const nx = -ty;
  const ny = tx;

  let alpha = 1;
  if (placement === "middle") alpha = 0.5;
  if (placement === "start") alpha = 0;

  const tipX = pFrom[0] + alpha * vx;
  const tipY = pFrom[1] + alpha * vy;

  const leftX = tipX - tx * size + nx * spread;
  const leftY = tipY - ty * size + ny * spread;
  const rightX = tipX - tx * size - nx * spread;
  const rightY = tipY - ty * size - ny * spread;

  return `M ${toFixed3(leftX)} ${toFixed3(leftY)} L ${toFixed3(tipX)} ${toFixed3(tipY)} L ${toFixed3(rightX)} ${toFixed3(rightY)}`;
}

function buildCornerQuarterPath(worldToSvg, box, corner, radius) {
  const left = box.minX;
  const right = box.maxX;
  const top = box.minY;
  const bottom = box.maxY;

  if (corner === "top-left") {
    const c = worldToSvg([left, top]);
    const a = worldToSvg([left + radius, top]);
    const b = worldToSvg([left, top + radius]);
    const rr = Math.hypot(a[0] - c[0], a[1] - c[1]);
    return `M ${toFixed3(c[0])} ${toFixed3(c[1])} L ${toFixed3(a[0])} ${toFixed3(a[1])} A ${toFixed3(rr)} ${toFixed3(rr)} 0 0 1 ${toFixed3(b[0])} ${toFixed3(b[1])} Z`;
  }

  if (corner === "top-right") {
    const c = worldToSvg([right, top]);
    const a = worldToSvg([right - radius, top]);
    const b = worldToSvg([right, top + radius]);
    const rr = Math.hypot(a[0] - c[0], a[1] - c[1]);
    return `M ${toFixed3(c[0])} ${toFixed3(c[1])} L ${toFixed3(a[0])} ${toFixed3(a[1])} A ${toFixed3(rr)} ${toFixed3(rr)} 0 0 0 ${toFixed3(b[0])} ${toFixed3(b[1])} Z`;
  }

  if (corner === "bottom-left") {
    const c = worldToSvg([left, bottom]);
    const a = worldToSvg([left + radius, bottom]);
    const b = worldToSvg([left, bottom - radius]);
    const rr = Math.hypot(a[0] - c[0], a[1] - c[1]);
    return `M ${toFixed3(c[0])} ${toFixed3(c[1])} L ${toFixed3(a[0])} ${toFixed3(a[1])} A ${toFixed3(rr)} ${toFixed3(rr)} 0 0 0 ${toFixed3(b[0])} ${toFixed3(b[1])} Z`;
  }

  const c = worldToSvg([right, bottom]);
  const a = worldToSvg([right - radius, bottom]);
  const b = worldToSvg([right, bottom - radius]);
  const rr = Math.hypot(a[0] - c[0], a[1] - c[1]);
  return `M ${toFixed3(c[0])} ${toFixed3(c[1])} L ${toFixed3(a[0])} ${toFixed3(a[1])} A ${toFixed3(rr)} ${toFixed3(rr)} 0 0 1 ${toFixed3(b[0])} ${toFixed3(b[1])} Z`;
}

function computeSceneBounds(circles, points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const cRaw of circles) {
    const { center, r } = parseCircle(cRaw);
    minX = Math.min(minX, center[0] - r);
    maxX = Math.max(maxX, center[0] + r);
    minY = Math.min(minY, center[1] - r);
    maxY = Math.max(maxY, center[1] + r);
  }

  for (const p of points) {
    minX = Math.min(minX, p[0]);
    maxX = Math.max(maxX, p[0]);
    minY = Math.min(minY, p[1]);
    maxY = Math.max(maxY, p[1]);
  }

  if (!Number.isFinite(minX)) {
    minX = -1;
    minY = -1;
    maxX = 1;
    maxY = 1;
  }

  if (maxX - minX < 1e-9) {
    minX -= 1;
    maxX += 1;
  }

  if (maxY - minY < 1e-9) {
    minY -= 1;
    maxY += 1;
  }

  return { minX, minY, maxX, maxY };
}

function buildWorldToSvgTransform(bounds, width, height, padding, invertY = true) {
  const innerW = width - 2 * padding;
  const innerH = height - 2 * padding;
  const worldW = bounds.maxX - bounds.minX;
  const worldH = bounds.maxY - bounds.minY;

  const scale = Math.min(innerW / worldW, innerH / worldH);
  const offsetX = (width - scale * worldW) / 2;
  const offsetY = (height - scale * worldH) / 2;

  return function worldToSvg(p) {
    const x = offsetX + (p[0] - bounds.minX) * scale;
    const yRaw = offsetY + (p[1] - bounds.minY) * scale;
    const y = invertY ? height - yRaw : yRaw;
    return [x, y];
  };
}

/**
 * Intersecta o raio R(t) = P + t*d (t >= 0) com uma circunferencia.
 * Retorna o menor t >= eps, ou null se nao houver intersecao valida.
 */
function firstRayCircleT(P, d, center, radius, eps = 1e-9) {
  const f = sub(P, center);
  const a = dot(d, d);
  const b = 2 * dot(f, d);
  const c = dot(f, f) - radius * radius;

  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;

  const sqrtDisc = Math.sqrt(Math.max(0, disc));
  const t1 = (-b - sqrtDisc) / (2 * a);
  const t2 = (-b + sqrtDisc) / (2 * a);

  let best = null;
  if (t1 >= eps) best = t1;
  if (t2 >= eps && (best === null || t2 < best)) best = t2;
  return best;
}

function canonicalizePointToBox(P, box) {
  const width = box.maxX - box.minX;
  const height = box.maxY - box.minY;

  let x = P[0];
  let y = P[1];

  while (x < box.minX) x += width;
  while (x > box.maxX) x -= width;
  while (y < box.minY) y += height;
  while (y > box.maxY) y -= height;

  if (Math.abs(x - box.minX) < 1e-12) x = box.minX;
  if (Math.abs(x - box.maxX) < 1e-12) x = box.maxX;
  if (Math.abs(y - box.minY) < 1e-12) y = box.minY;
  if (Math.abs(y - box.maxY) < 1e-12) y = box.maxY;

  return [x, y];
}

function firstRayBoxExit(P, d, box, eps = 1e-9) {
  const candidates = [];

  if (d[0] > eps) {
    const t = (box.maxX - P[0]) / d[0];
    const y = P[1] + t * d[1];
    if (t >= eps && y >= box.minY - eps && y <= box.maxY + eps) {
      candidates.push({ t, side: "right" });
    }
  }

  if (d[0] < -eps) {
    const t = (box.minX - P[0]) / d[0];
    const y = P[1] + t * d[1];
    if (t >= eps && y >= box.minY - eps && y <= box.maxY + eps) {
      candidates.push({ t, side: "left" });
    }
  }

  if (d[1] > eps) {
    const t = (box.maxY - P[1]) / d[1];
    const x = P[0] + t * d[0];
    if (t >= eps && x >= box.minX - eps && x <= box.maxX + eps) {
      candidates.push({ t, side: "bottom" });
    }
  }

  if (d[1] < -eps) {
    const t = (box.minY - P[1]) / d[1];
    const x = P[0] + t * d[0];
    if (t >= eps && x >= box.minX - eps && x <= box.maxX + eps) {
      candidates.push({ t, side: "top" });
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => a.t - b.t);
  const bestT = candidates[0].t;
  const sides = candidates
    .filter((candidate) => Math.abs(candidate.t - bestT) <= eps)
    .map((candidate) => candidate.side);

  return { t: bestT, sides };
}

function wrapAcrossBox(Q, sides, box) {
  let x = Q[0];
  let y = Q[1];

  for (const side of sides) {
    if (side === "left") x = box.maxX;
    if (side === "right") x = box.minX;
    if (side === "top") y = box.maxY;
    if (side === "bottom") y = box.minY;
  }

  return [x, y];
}

function firstRayPeriodicCircleHit(P, d, circles, box, eps = 1e-9) {
  const width = box.maxX - box.minX;
  const height = box.maxY - box.minY;

  let best = null;

  for (const cRaw of circles) {
    const { center, r } = parseCircle(cRaw);
    if (!(r > 0)) continue;

    for (let sx = -1; sx <= 1; sx += 1) {
      for (let sy = -1; sy <= 1; sy += 1) {
        const imageCenter = [center[0] + sx * width, center[1] + sy * height];
        const t = firstRayCircleT(P, d, imageCenter, r, eps);
        if (t === null) continue;

        if (!best || t < best.t) {
          best = { t, center, imageCenter, r };
        }
      }
    }
  }

  return best;
}

/**
 * Recebe P=[x,y], d=[dx,dy] e lista de circulos.
 * Retorna [Q, u], onde:
 * - Q: ponto de intersecao mais proximo de P no raio de direcao d;
 * - u: vetor refletido em Q (reflexao especular perfeita).
 * Se nao houver intersecao, retorna [null, null].
 */
function reflectRayOnCircles(P, d, circles, eps = 1e-9) {
  if (!Array.isArray(P) || P.length !== 2) {
    throw new Error("P deve ser [x, y].");
  }
  if (!Array.isArray(d) || d.length !== 2) {
    throw new Error("d deve ser [dx, dy].");
  }
  if (!Array.isArray(circles)) {
    throw new Error("circles deve ser uma lista de circulos.");
  }

  const dir = normalize(d);

  let bestT = Infinity;
  let bestCircle = null;

  for (const cRaw of circles) {
    const { center, r } = parseCircle(cRaw);
    if (!(r > 0)) continue;

    const t = firstRayCircleT(P, dir, center, r, eps);
    if (t !== null && t < bestT) {
      bestT = t;
      bestCircle = { center, r };
    }
  }

  if (!bestCircle) {
    return [null, null];
  }

  const Q = add(P, mul(dir, bestT));

  // Vetor radial unitario (centro -> ponto de intersecao): normal da circunferencia.
  const n = normalize(sub(Q, bestCircle.center));

  // Reflexao especular na normal: u = d - 2(d.n)n
  const dn = dot(dir, n);
  const u = normalize(sub(dir, mul(n, 2 * dn)));

  return [Q, u];
}

/**
 * Itera reflexoes para obter a trajetoria do raio.
 * Retorna objeto com pontos e direcoes por etapa.
 */
function traceReflections(P0, d0, circles, maxBounces, eps = 1e-9) {
  const points = [P0.slice()];
  const directions = [];

  let P = P0.slice();
  let d = normalize(d0);

  for (let i = 0; i < maxBounces; i += 1) {
    const [Q, u] = reflectRayOnCircles(P, d, circles, eps);
    if (!Q) break;

    points.push(Q);
    directions.push(u);

    // Avanco minimo para evitar reencontrar o mesmo ponto por erro numerico.
    P = add(Q, mul(u, eps * 10));
    d = u;
  }

  return { points, directions };
}

function traceTorusReflections(P0, d0, circles, maxEvents, options = {}) {
  const eps = options.eps ?? 1e-9;
  const box = normalizeBox(options.box);

  const segments = [];
  const wraps = [];
  const collisions = [];

  let P = canonicalizePointToBox(P0.slice(), box);
  let d = normalize(d0);
  let segmentStart = P.slice();

  for (let i = 0; i < maxEvents; i += 1) {
    const hitCircle = firstRayPeriodicCircleHit(P, d, circles, box, eps);
    const hitSide = firstRayBoxExit(P, d, box, eps);

    if (!hitCircle && !hitSide) break;

    const sideT = hitSide ? hitSide.t : Infinity;
    const circleT = hitCircle ? hitCircle.t : Infinity;

    if (circleT <= sideT + eps) {
      const Q = add(P, mul(d, circleT));
      segments.push([segmentStart, Q]);

      const n = normalize(sub(Q, hitCircle.imageCenter));
      const reflected = normalize(sub(d, mul(n, 2 * dot(d, n))));
      collisions.push({ point: Q, center: hitCircle.center, imageCenter: hitCircle.imageCenter });

      P = canonicalizePointToBox(add(Q, mul(reflected, eps * 10)), box);
      d = reflected;
      segmentStart = Q;
      continue;
    }

    const exitPoint = add(P, mul(d, sideT));
    const entryPoint = wrapAcrossBox(exitPoint, hitSide.sides, box);
    segments.push([segmentStart, exitPoint]);
    wraps.push({ from: exitPoint, to: entryPoint, sides: hitSide.sides.slice() });

    P = canonicalizePointToBox(add(entryPoint, mul(d, eps * 10)), box);
    segmentStart = entryPoint;
  }

  return {
    start: canonicalizePointToBox(P0.slice(), box),
    direction: normalize(d0),
    segments,
    wraps,
    collisions,
    box,
  };
}

/**
 * Renderiza um SVG da cena com os circulos e a trajetoria refletida.
 */
function renderTrajectorySvg(
  circles,
  trajectory,
  options = {}
) {
  const width = options.width ?? 900;
  const height = options.height ?? 700;
  const padding = options.padding ?? 40;
  const invertY = options.invertY ?? true;
  const title = options.title ?? "Trajetoria com reflexoes em circulos";

  const colors = {
    background: options.background ?? "#ffffff",
    circleStroke: options.circleStroke ?? "#334155",
    circleFill: options.circleFill ?? "none",
    pathStroke: options.pathStroke ?? "#0f766e",
    pointFill: options.pointFill ?? "#b91c1c",
    startFill: options.startFill ?? "#1d4ed8",
  };

  const pathStrokeWidth = options.pathStrokeWidth ?? 2.5;
  const circleStrokeWidth = options.circleStrokeWidth ?? 1.5;
  const pointRadius = options.pointRadius ?? 3.2;
  const showPoints = options.showPoints ?? true;
  const startArrow = options.startArrow ?? false;
  const endArrow = options.endArrow ?? false;
  const startArrowPlacement = options.startArrowPlacement ?? "middle";
  const endArrowPlacement = options.endArrowPlacement ?? "end";
  const arrowSize = options.arrowSize ?? 18;
  const arrowSpread = options.arrowSpread ?? 9;
  const arrowStrokeWidth = options.arrowStrokeWidth ?? pathStrokeWidth;

  const points = Array.isArray(trajectory?.points) ? trajectory.points : [];
  const parsedCircles = circles.map(parseCircle);

  const bounds = computeSceneBounds(parsedCircles, points);
  const worldToSvg = buildWorldToSvgTransform(bounds, width, height, padding, invertY);

  const circleTags = parsedCircles
    .map(({ center, r }) => {
      const c = worldToSvg(center);
      const edge = worldToSvg([center[0] + r, center[1]]);
      const rr = Math.hypot(edge[0] - c[0], edge[1] - c[1]);
      return `<circle cx="${toFixed3(c[0])}" cy="${toFixed3(c[1])}" r="${toFixed3(rr)}" fill="${escapeXml(colors.circleFill)}" stroke="${escapeXml(colors.circleStroke)}" stroke-width="${toFixed3(circleStrokeWidth)}"/>`;
    })
    .join("\n");

  const polylinePoints = points
    .map((p) => worldToSvg(p))
    .map((p) => `${toFixed3(p[0])},${toFixed3(p[1])}`)
    .join(" ");

  const pathTag =
    points.length >= 2
      ? `<polyline points="${polylinePoints}" fill="none" stroke="${escapeXml(colors.pathStroke)}" stroke-width="${toFixed3(pathStrokeWidth)}" stroke-linecap="round" stroke-linejoin="round"/>`
      : "";

  const pointTags = showPoints
    ? points
    .map((p, i) => {
      const q = worldToSvg(p);
      const fill = i === 0 ? colors.startFill : colors.pointFill;
      return `<circle cx="${toFixed3(q[0])}" cy="${toFixed3(q[1])}" r="${toFixed3(pointRadius)}" fill="${escapeXml(fill)}"/>`;
    })
    .join("\n")
    : "";

  let startArrowTag = "";
  if (startArrow && points.length >= 2) {
    const p0 = worldToSvg(points[0]);
    const p1 = worldToSvg(points[1]);
    const d = buildOpenArrowPath(p0, p1, startArrowPlacement, arrowSize, arrowSpread);
    if (d) {
      startArrowTag = `<path d="${d}" fill="none" stroke="${escapeXml(colors.pathStroke)}" stroke-width="${toFixed3(arrowStrokeWidth)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
  }

  let endArrowTag = "";
  if (endArrow && points.length >= 2) {
    const pA = worldToSvg(points[points.length - 2]);
    const pB = worldToSvg(points[points.length - 1]);
    const d = buildOpenArrowPath(pA, pB, endArrowPlacement, arrowSize, arrowSpread);
    if (d) {
      endArrowTag = `<path d="${d}" fill="none" stroke="${escapeXml(colors.pathStroke)}" stroke-width="${toFixed3(arrowStrokeWidth)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
  }

  const backgroundTag =
    colors.background === "none" || colors.background === "transparent"
      ? ""
      : `<rect x="0" y="0" width="${width}" height="${height}" fill="${escapeXml(colors.background)}"/>`;

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">`,
    `  <title>${escapeXml(title)}</title>`,
    `  ${backgroundTag}`,
    `  ${circleTags}`,
    `  ${pathTag}`,
    `  ${startArrowTag}`,
    `  ${endArrowTag}`,
    `  ${pointTags}`,
    `</svg>`,
    "",
  ].join("\n");
}

/**
 * Gera e salva um SVG com a trajetoria refletida.
 */
function saveTrajectorySvg(filePath, P0, d0, circles, maxBounces, options = {}) {
  const trajectory = traceReflections(P0, d0, circles, maxBounces, options.eps ?? 1e-9);
  const svg = renderTrajectorySvg(circles, trajectory, options);
  fs.writeFileSync(filePath, svg, "utf8");
  return { filePath, trajectory, svg };
}

function renderTorusTrajectorySvg(circles, trajectory, options = {}) {
  const box = normalizeBox(options.box ?? trajectory.box);
  const width = options.width ?? 900;
  const height = options.height ?? 900;
  const padding = options.padding ?? 40;
  const invertY = options.invertY ?? false;
  const title = options.title ?? "Trajetoria em bilhar toroidal";

  const colors = {
    background: options.background ?? "none",
    circleStroke: options.circleStroke ?? "#3f3f43",
    circleFill: options.circleFill ?? "#fde68a",
    pathStroke: options.pathStroke ?? "#ef4444",
    boundaryStroke: options.boundaryStroke ?? "#3f3f46",
    wrapPointStroke: options.wrapPointStroke ?? "#3f3f46",
    wrapPointFill: options.wrapPointFill ?? "#ffffff",
    labelColor: options.labelColor ?? "#111111",
  };

  const worldToSvg = buildWorldToSvgTransform(box, width, height, padding, invertY);
  const parsedCircles = circles.map(parseCircle);
  const pathStrokeWidth = options.pathStrokeWidth ?? 5;
  const circleStrokeWidth = options.circleStrokeWidth ?? 4;
  const boundaryStrokeWidth = options.boundaryStrokeWidth ?? 4;
  const wrapPointRadius = options.wrapPointRadius ?? 0.016 * Math.min(width, height);
  const boundaryDashArray = options.boundaryDashArray ?? "10 8";
  const startArrow = options.startArrow ?? true;
  const endArrow = options.endArrow ?? true;
  const startArrowPlacement = options.startArrowPlacement ?? "middle";
  const endArrowPlacement = options.endArrowPlacement ?? "middle";
  const arrowSize = options.arrowSize ?? 16;
  const arrowSpread = options.arrowSpread ?? 8;
  const arrowStrokeWidth = options.arrowStrokeWidth ?? pathStrokeWidth;

  const backgroundTag =
    colors.background === "none" || colors.background === "transparent"
      ? ""
      : `<rect x="0" y="0" width="${width}" height="${height}" fill="${escapeXml(colors.background)}"/>`;

  const boxTopLeft = worldToSvg([box.minX, box.minY]);
  const boxBottomRight = worldToSvg([box.maxX, box.maxY]);
  const rectX = Math.min(boxTopLeft[0], boxBottomRight[0]);
  const rectY = Math.min(boxTopLeft[1], boxBottomRight[1]);
  const rectW = Math.abs(boxBottomRight[0] - boxTopLeft[0]);
  const rectH = Math.abs(boxBottomRight[1] - boxTopLeft[1]);

  const clipId = "clipBox";
  const boxTag = `<rect x="${toFixed3(rectX)}" y="${toFixed3(rectY)}" width="${toFixed3(rectW)}" height="${toFixed3(rectH)}" fill="none" stroke="${escapeXml(colors.boundaryStroke)}" stroke-width="${toFixed3(boundaryStrokeWidth)}" stroke-dasharray="${escapeXml(boundaryDashArray)}"/>`;

  const periodicShifts = [-1, 0, 1];
  const boxWidth = box.maxX - box.minX;
  const boxHeight = box.maxY - box.minY;
  const circleTags = parsedCircles
    .flatMap(({ center, r }) => periodicShifts.flatMap((sx) => periodicShifts.map((sy) => ({ center: [center[0] + sx * boxWidth, center[1] + sy * boxHeight], r }))))
    .map(({ center, r }) => {
      const c = worldToSvg(center);
      const edge = worldToSvg([center[0] + r, center[1]]);
      const rr = Math.hypot(edge[0] - c[0], edge[1] - c[1]);
      return `<circle cx="${toFixed3(c[0])}" cy="${toFixed3(c[1])}" r="${toFixed3(rr)}" fill="${escapeXml(colors.circleFill)}" stroke="${escapeXml(colors.circleStroke)}" stroke-width="${toFixed3(circleStrokeWidth)}"/>`;
    })
    .join("\n");

  const cornerQuarterTags = (options.cornerCircles ?? [])
    .flatMap((item) => {
      const radius = item.r;
      return ["top-left", "top-right", "bottom-left", "bottom-right"].map((corner) => buildCornerQuarterPath(worldToSvg, box, corner, radius));
    })
    .map((pathData) => `<path d="${pathData}" fill="${escapeXml(colors.circleFill)}" stroke="${escapeXml(colors.circleStroke)}" stroke-width="${toFixed3(circleStrokeWidth)}" stroke-linejoin="round"/>`)
    .join("\n");

  const segmentTags = (trajectory.segments ?? [])
    .map(([a, b]) => {
      const p = worldToSvg(a);
      const q = worldToSvg(b);
      return `<line x1="${toFixed3(p[0])}" y1="${toFixed3(p[1])}" x2="${toFixed3(q[0])}" y2="${toFixed3(q[1])}" stroke="${escapeXml(colors.pathStroke)}" stroke-width="${toFixed3(pathStrokeWidth)}" stroke-linecap="round"/>`;
    })
    .join("\n");

  const wrapKey = (p) => `${Math.round(p[0] * 1e6)},${Math.round(p[1] * 1e6)}`;
  const wrapPointMap = new Map();
  for (const wrap of trajectory.wraps ?? []) {
    wrapPointMap.set(wrapKey(wrap.from), wrap.from);
    wrapPointMap.set(wrapKey(wrap.to), wrap.to);
  }
  const wrapPointTags = Array.from(wrapPointMap.values())
    .map((p) => {
      const q = worldToSvg(p);
      return `<circle cx="${toFixed3(q[0])}" cy="${toFixed3(q[1])}" r="${toFixed3(wrapPointRadius)}" fill="${escapeXml(colors.wrapPointFill)}" stroke="${escapeXml(colors.wrapPointStroke)}" stroke-width="${toFixed3(circleStrokeWidth)}"/>`;
    })
    .join("\n");

  let startArrowTag = "";
  if (startArrow && (trajectory.segments?.length ?? 0) > 0) {
    const [a, b] = trajectory.segments[0];
    const p = worldToSvg(a);
    const q = worldToSvg(b);
    const d = buildOpenArrowPath(p, q, startArrowPlacement, arrowSize, arrowSpread);
    if (d) {
      startArrowTag = `<path d="${d}" fill="none" stroke="${escapeXml(colors.pathStroke)}" stroke-width="${toFixed3(arrowStrokeWidth)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
  }

  let endArrowTag = "";
  if (endArrow && (trajectory.segments?.length ?? 0) > 0) {
    const [a, b] = trajectory.segments[trajectory.segments.length - 1];
    const p = worldToSvg(a);
    const q = worldToSvg(b);
    const d = buildOpenArrowPath(p, q, endArrowPlacement, arrowSize, arrowSpread);
    if (d) {
      endArrowTag = `<path d="${d}" fill="none" stroke="${escapeXml(colors.pathStroke)}" stroke-width="${toFixed3(arrowStrokeWidth)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
  }

  const segmentArrowTags = (options.segmentArrows ?? [])
    .map((arrow) => {
      const index = arrow.segment ?? 0;
      const segment = trajectory.segments?.[index];
      if (!segment) return "";
      const [a, b] = segment;
      const p = worldToSvg(a);
      const q = worldToSvg(b);
      const d = buildOpenArrowPath(
        p,
        q,
        arrow.placement ?? "middle",
        arrow.size ?? arrowSize,
        arrow.spread ?? arrowSpread
      );
      if (!d) return "";
      return `<path d="${d}" fill="none" stroke="${escapeXml(arrow.stroke ?? colors.pathStroke)}" stroke-width="${toFixed3(arrow.strokeWidth ?? arrowStrokeWidth)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .filter(Boolean)
    .join("\n");

  const labelTags = (options.labels ?? [])
    .map((label) => {
      const p = worldToSvg(label.point);
      const dx = label.dx ?? 0;
      const dy = label.dy ?? 0;
      const fontSize = label.fontSize ?? 56;
      const textAnchor = label.textAnchor ? ` text-anchor="${escapeXml(label.textAnchor)}"` : "";
      const dominantBaseline = label.dominantBaseline ? ` dominant-baseline="${escapeXml(label.dominantBaseline)}"` : "";
      return `<text x="${toFixed3(p[0] + dx)}" y="${toFixed3(p[1] + dy)}" fill="${escapeXml(colors.labelColor)}" font-size="${toFixed3(fontSize)}" font-family="STIX Two Math, Times New Roman, serif" font-style="italic"${textAnchor}${dominantBaseline}>${escapeXml(label.text)}</text>`;
    })
    .join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">`,
    `  <title>${escapeXml(title)}</title>`,
    `  ${backgroundTag}`,
    `  <defs><clipPath id="${clipId}"><rect x="${toFixed3(rectX)}" y="${toFixed3(rectY)}" width="${toFixed3(rectW)}" height="${toFixed3(rectH)}"/></clipPath></defs>`,
    `  <g clip-path="url(#${clipId})">`,
    `  ${circleTags}`,
    `  ${cornerQuarterTags}`,
    `  ${segmentTags}`,
    `  </g>`,
    `  ${boxTag}`,
    `  ${wrapPointTags}`,
    `  ${startArrowTag}`,
    `  ${endArrowTag}`,
    `  ${segmentArrowTags}`,
    `  ${labelTags}`,
    `</svg>`,
    "",
  ].join("\n");
}

function saveTorusTrajectorySvg(filePath, P0, d0, circles, maxEvents, options = {}) {
  const trajectory = traceTorusReflections(P0, d0, circles, maxEvents, options);
  const svg = renderTorusTrajectorySvg(circles, trajectory, options);
  fs.writeFileSync(filePath, svg, "utf8");
  return { filePath, trajectory, svg };
}

module.exports = {
  reflectRayOnCircles,
  traceReflections,
  traceTorusReflections,
  renderTrajectorySvg,
  renderTorusTrajectorySvg,
  saveTrajectorySvg,
  saveTorusTrajectorySvg,
};
