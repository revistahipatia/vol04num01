"use strict";

const path = require("node:path");
const { saveTrajectorySvg } = require("./ray_reflection");

// Configuracao aproximada dos circulos da figura fig109.png (em pixels da imagem original).
const circles = [
  { center: [87, 212], r: 86 },
  { center: [362, 212], r: 86 },
  { center: [637, 202], r: 86 },
  { center: [911, 202], r: 86 },

  { center: [87, 489], r: 86 },
  { center: [362, 489], r: 86 },
  { center: [637, 489], r: 86 },
  { center: [911, 489], r: 86 },

  { center: [224, 64], r: 64 },
  { center: [499, 64], r: 64 },
  { center: [774, 64], r: 64 },

  { center: [224, 348], r: 64 },
  { center: [499, 348], r: 64 },
  { center: [774, 348], r: 64 },

  { center: [224, 625], r: 64 },
  { center: [499, 625], r: 64 },
  { center: [774, 625], r: 64 },
];

// Parametros ajustados para produzir uma trajetoria visualmente semelhante.
const P0 = [317.7120711688972, 342.06030009758814];
const d0 = [0.6303475355855861, -0.7763130711131807];
const maxBounces = 13;

const outputFile = path.join(__dirname, "fig109_repro.svg");

saveTrajectorySvg(outputFile, P0, d0, circles, maxBounces, {
  width: 1000,
  height: 693,
  padding: 1,
  invertY: false,
  title: "Reproducao aproximada da fig109",
  background: "none",
  circleStroke: "#3f3f43",
  circleFill: "#ece8a6",
  circleStrokeWidth: 4,
  pathStroke: "#e83b3b",
  pathStrokeWidth: 5,
  showPoints: false,
  startArrow: true,
  startArrowPlacement: "middle",
  endArrow: true,
  endArrowPlacement: "middle",
  arrowSize: 16,
  arrowSpread: 8,
  arrowStrokeWidth: 4.5,
});

console.log("SVG gerado:", outputFile);
