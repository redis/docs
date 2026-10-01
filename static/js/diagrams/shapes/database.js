import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/+esm";

// Contract for every module in this folder:
// - Export createModel({ color, accent }) returning a THREE.Group, with no
//   side effects on the scene.
// - Import three from exactly the URL above, so every module shares one copy.
// - Fit within 1.1 x 1.1 units across and 1.1 high, origin at the bottom
//   center, +Y up, front facing +Z (toward the default camera).
// - Use MeshStandardMaterial only, created fresh on each call: the diagram
//   changes material opacity and emissive per node to dim and highlight.
// - No lights or cameras.
// - Optional animation: set group.userData.update = ({ dt, active }) => {...}.
//   The diagram calls it every frame with the seconds since the last frame and
//   whether the node is selected or on the active scenario, and never calls it
//   for readers who prefer reduced motion.

const RADIUS = 0.5;
const SEGMENTS = 3;
const SEGMENT_HEIGHT = 0.32;
const BAND_HEIGHT = 0.05;
const BAND_OUTSET = 0.01;
const RIM_TUBE = 0.05;
const RADIAL_SEGMENTS = 48;

// A drum split into stacked segments by light bands, with a colored rim, after
// the "Source database" icon in the RDI diagrams (with its colors inverted, so
// it stands out on the white surface).
export function createModel({ color = 0x2d4754, accent = 0xff4438 } = {}) {
  const group = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.05 });
  const band = new THREE.MeshStandardMaterial({ color: 0xe8ebec, roughness: 0.6 });
  const cap = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.4 });

  const segmentGeometry = new THREE.CylinderGeometry(RADIUS, RADIUS, SEGMENT_HEIGHT, RADIAL_SEGMENTS);
  const bandRadius = RADIUS + BAND_OUTSET;
  const bandGeometry = new THREE.CylinderGeometry(bandRadius, bandRadius, BAND_HEIGHT, RADIAL_SEGMENTS);

  let y = 0;
  for (let i = 0; i < SEGMENTS; i++) {
    const segment = new THREE.Mesh(segmentGeometry, body);
    segment.position.y = y + SEGMENT_HEIGHT / 2;
    group.add(segment);
    y += SEGMENT_HEIGHT;

    if (i < SEGMENTS - 1) {
      const ring = new THREE.Mesh(bandGeometry, band);
      ring.position.y = y + BAND_HEIGHT / 2;
      group.add(ring);
      y += BAND_HEIGHT;
    }
  }

  // The icon outlines the top in the accent color rather than filling it.
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(RADIUS - RIM_TUBE, RIM_TUBE, 12, RADIAL_SEGMENTS),
    cap
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = y;
  group.add(rim);

  return group;
}
