import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/+esm";

// Follows the contract in database.js.

// The brand's Redis cube, from layouts/partials/icons/redis-cube.html. That
// SVG draws the top-face symbols already in isometric projection, so they're
// mapped back onto a square face with the inverse of the top face's transform.
const SIZE = 0.88;
const SVG_FACE = 345.417;
const SVG_TOP_TRANSFORM = [0.866025, 0.5, -0.866025, 0.5, 301.158, 2];
const SVG_OUTLINE = 4.0784;
const RED = "#FF4438";
const MAROON = "#6B2B2B";
const INK = "#091A23";
const TEXTURE_SIZE = 512;

const TOP_SYMBOLS = [
  { rule: "evenodd", d: "M409.968 220.297L334.448 176.696L409.965 133.096L485.485 176.697L409.968 220.297Z" },
  { rule: "evenodd", d: "M300.237 289.189L214.971 239.961L337.714 218.404L300.376 289.269L300.283 289.215L300.237 289.189Z" },
  { rule: "evenodd", d: "M218.939 200.12C198.037 212.188 164.155 212.187 143.252 200.119C122.35 188.051 122.349 168.489 143.251 156.421C164.153 144.353 198.035 144.354 218.938 156.422C239.841 168.49 239.842 188.052 218.939 200.12Z" },
  { rule: "nonzero", d: "M347.397 87.4418C349.062 95.9563 351.377 105.449 337.25 113.605C324.631 120.89 308.847 117.206 299.513 112.198C308.099 113.962 318.218 113.564 326.434 108.568C342.133 98.9013 338.663 84.0611 325.376 76.39C309.483 67.2144 286.118 67.4691 265.45 79.4017C250.669 87.936 237.956 101.743 234.78 113.805C243.766 119.145 260.724 123.044 261.252 121.235C264.215 110.899 267.681 103.347 273.292 97.3213C274.605 111.792 276.733 145.93 278.637 151.057C283.98 153.688 303.415 157.81 306.423 156.073C307.338 155.545 307.602 154.789 307.606 153.735C306.582 143.224 304.97 134.204 302.892 125.812C315.942 132.337 336.84 137.46 353.648 127.755C368.692 119.07 372.791 104.219 355.232 86.2284C353.019 84.0453 347.012 84.8063 347.394 87.4433L347.397 87.4418ZM310.59 85.9787C318.277 90.4164 314.465 96.9769 307.532 100.979C303.827 103.119 300.012 104.202 296.501 104.774C294.397 98.7773 292.092 92.7108 289.643 86.2087C298.722 82.4798 305.926 83.283 310.59 85.9758L310.59 85.9787Z" },
];

function faceCanvas(fill) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  return { canvas, ctx };
}

// Adjacent faces each show the inner half of their border, so the stroke is
// doubled to give the SVG's outline width where two faces meet.
function outline(ctx) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = (SVG_OUTLINE / SVG_FACE) * TEXTURE_SIZE * 2;
  ctx.strokeRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
}

// Canvas x runs from the back corner to the right corner and canvas y from the
// back corner to the left corner, matching the SVG top face's own axes once
// the cube is turned corner-on.
function topCanvas() {
  const { canvas, ctx } = faceCanvas(RED);
  const toFace = new DOMMatrix(SVG_TOP_TRANSFORM).inverse();
  ctx.setTransform(new DOMMatrix().scale(TEXTURE_SIZE / SVG_FACE).multiply(toFace));
  ctx.fillStyle = "#FFFFFF";
  for (const symbol of TOP_SYMBOLS) ctx.fill(new Path2D(symbol.d), symbol.rule);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  outline(ctx);
  return canvas;
}

// Side faces are split into three layers by dark lines.
function sideCanvas(fill) {
  const { canvas, ctx } = faceCanvas(fill);
  ctx.strokeStyle = INK;
  ctx.lineWidth = (SVG_OUTLINE / SVG_FACE) * TEXTURE_SIZE;
  for (const y of [TEXTURE_SIZE / 3, (TEXTURE_SIZE * 2) / 3]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(TEXTURE_SIZE, y);
    ctx.stroke();
  }
  outline(ctx);
  return canvas;
}

let textures = null;

function sharedTextures() {
  if (textures) return textures;
  const make = (canvas) => {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  };
  textures = {
    top: make(topCanvas()),
    redSide: make(sideCanvas(RED)),
    maroonSide: make(sideCanvas(MAROON)),
  };
  return textures;
}

// The right-hand face keeps the brand's maroon, rather than relying on the
// scene lighting, so the cube reads as the familiar icon.
export function createModel() {
  const t = sharedTextures();
  const face = (map) => new THREE.MeshStandardMaterial({ map, roughness: 0.6, metalness: 0.05 });
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z. Turned -45 degrees about
  // Y, +z faces front-left and +x faces front-right.
  const materials = [
    face(t.maroonSide),
    face(t.redSide),
    face(t.top),
    face(t.redSide),
    face(t.redSide),
    face(t.maroonSide),
  ];
  const cube = new THREE.Mesh(new THREE.BoxGeometry(SIZE, SIZE, SIZE).translate(0, SIZE / 2, 0), materials);
  cube.rotation.y = -Math.PI / 4;

  const group = new THREE.Group();
  group.add(cube);
  return group;
}
