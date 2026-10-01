import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/+esm";

// Follows the contract in database.js.

const DISC_RADIUS = 0.52;
const DISC_HEIGHT = 0.35;
const RING_RADIUS = 0.42;
const RING_TUBE = 0.035;
const RING_ARC = Math.PI * 1.7;
const COG_TEETH = 8;
const COG_OUTER = 0.27;
const COG_ROOT = 0.21;
const COG_HOLE = 0.08;
const COG_DEPTH = 0.1;
const SPIN_SPEED = 1.2;

function cogShape() {
  const shape = new THREE.Shape();
  const pitch = (Math.PI * 2) / COG_TEETH;
  for (let i = 0; i < COG_TEETH; i++) {
    const a = i * pitch;
    const points = [
      [COG_ROOT, a - pitch * 0.3],
      [COG_OUTER, a - pitch * 0.18],
      [COG_OUTER, a + pitch * 0.18],
      [COG_ROOT, a + pitch * 0.3],
    ];
    points.forEach(([r, angle], j) => {
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      if (i === 0 && j === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
  }
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, COG_HOLE, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return shape;
}

// A short disc topped by a rotary arrow and a cog, after the RDI icon in the
// RDI diagrams (colors inverted, like the database model). The cog turns in
// the arrow's direction while the node is active.
export function createModel({ color = 0x2d4754, accent = 0xff4438 } = {}) {
  const group = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.05 });
  const arrowMaterial = new THREE.MeshStandardMaterial({ color: 0xe8ebec, roughness: 0.6 });
  const cogMaterial = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.4 });

  const disc = new THREE.Mesh(new THREE.CylinderGeometry(DISC_RADIUS, DISC_RADIUS, DISC_HEIGHT, 48), body);
  disc.position.y = DISC_HEIGHT / 2;
  group.add(disc);

  // The torus arc runs clockwise as seen from above once laid flat, and the
  // whole arrow is turned so its gap and arrowhead sit at the upper left.
  const arrow = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 10, 64, RING_ARC), arrowMaterial);
  ring.rotation.x = Math.PI / 2;
  arrow.add(ring);

  const end = new THREE.Vector3(RING_RADIUS * Math.cos(RING_ARC), 0, RING_RADIUS * Math.sin(RING_ARC));
  const tangent = new THREE.Vector3(-Math.sin(RING_ARC), 0, Math.cos(RING_ARC));
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 16), arrowMaterial);
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
  head.position.copy(end).addScaledVector(tangent, 0.08);
  arrow.add(head);

  arrow.rotation.y = Math.PI * 0.6;
  arrow.position.y = DISC_HEIGHT + RING_TUBE;
  group.add(arrow);

  const cogGeometry = new THREE.ExtrudeGeometry(cogShape(), {
    depth: COG_DEPTH, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2,
  });
  cogGeometry.rotateX(-Math.PI / 2);
  const cog = new THREE.Mesh(cogGeometry, cogMaterial);
  cog.position.y = DISC_HEIGHT;
  group.add(cog);

  group.userData.update = ({ dt, active }) => {
    if (active) cog.rotation.y -= SPIN_SPEED * dt;
  };

  return group;
}
