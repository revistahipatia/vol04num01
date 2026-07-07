"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { renderTorusTrajectorySvg, traceTorusReflections } = require("./ray_reflection");

const box = { minX: 0, minY: 0, maxX: 1, maxY: 1 };
const circles = [
  { center: [0.5, 0.5], r: 0.28 },
];

const physicsCircles = [
  { center: [0.5, 0.5], r: 0.28 },
  { center: [0, 0], r: 0.285 },
];

const P0 = [0.44008029934773196, 0];
const d0 = [-0.7310125603029233, 0.682364005996334];
const fullTrajectory = traceTorusReflections(P0, d0, physicsCircles, 8, { box });
const displayWraps = fullTrajectory.wraps.slice(0, 2);
const trajectory = {
  box,
  segments: fullTrajectory.segments.slice(0, 6),
  wraps: displayWraps,
};

const firstLeftWrap = displayWraps[0];
const firstBottomWrap = displayWraps[1];
const rightWrapPoint = firstLeftWrap ? firstLeftWrap.to : [1, 0.411];
const topWrapPoint = firstBottomWrap ? firstBottomWrap.to : [0.551, 0];

const outputFile = path.join(__dirname, "fig97_repro.svg");

const svg = renderTorusTrajectorySvg(circles, trajectory, {
  box,
  width: 1000,
  height: 1000,
  padding: 78,
  invertY: false,
  title: "Reproducao aproximada da fig97",
  background: "none",
  circleStroke: "#3f3f46",
  circleFill: "#fee08b",
  circleStrokeWidth: 5,
  cornerCircles: [{ r: 0.285 }],
  boundaryStroke: "#3f3f46",
  boundaryStrokeWidth: 6,
  boundaryDashArray: "16 10",
  pathStroke: "#ef3b3b",
  pathStrokeWidth: 7,
  wrapPointStroke: "#4b5563",
  wrapPointFill: "#ffffff",
  wrapPointRadius: 14,
  startArrow: false,
  endArrow: false,
  arrowSize: 26,
  arrowSpread: 13,
  arrowStrokeWidth: 6,
  segmentArrows: [
    { segment: 0, placement: "middle" },
    { segment: 2, placement: "middle" },
    { segment: 4, placement: "middle" },
  ],
  labels: [
    { text: "x", point: topWrapPoint, dx: 0, dy: -34, fontSize: 70, textAnchor: "middle" },
    { text: "x'", point: firstBottomWrap ? firstBottomWrap.from : [0.438, 1], dx: 0, dy: 52, fontSize: 70, textAnchor: "middle" },
    { text: "y", point: rightWrapPoint, dx: 60, dy: 0, fontSize: 70, textAnchor: "end", dominantBaseline: "middle" },
    { text: "y'", point: firstLeftWrap ? firstLeftWrap.from : [0, 0.417], dx: -20, dy: 0, fontSize: 70, textAnchor: "end", dominantBaseline: "middle" },
  ],
});

fs.writeFileSync(outputFile, svg, "utf8");

console.log("SVG gerado:", outputFile);
