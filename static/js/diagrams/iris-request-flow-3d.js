import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/+esm";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js/+esm";
import { CSS2DRenderer, CSS2DObject } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/renderers/CSS2DRenderer.js/+esm";
import { createModel as createDatabase } from "./shapes/database.js";
import { createModel as createRdi } from "./shapes/rdi.js";
import { createModel as createRedis } from "./shapes/redis.js";

const MODELS = { database: createDatabase, rdi: createRdi, redis: createRedis };

// Graph copied from the context-map block in develop/ai/context-engine/concepts/request-flow.md,
// plus a Source database node that the 2D version doesn't have.
const NODES = {
  agent: {
    label: "Agent", type: "process", col: 0, row: 1,
    description: "The calling application or AI agent that sends a prompt.",
    links: [{ label: "Read more", url: "/develop/ai/agent-builder" }],
  },
  langcache: {
    label: "LangCache hit?", type: "decision", col: 1, row: 0, labelSide: "back",
    description: "LangCache: checks whether a similar prompt is already cached before calling the model.",
    links: [{ label: "Read more", url: "/develop/ai/context-engine/langcache" }],
  },
  agentMemory: {
    label: "Agent Memory", type: "process", col: 1, row: 1,
    description: "Agent Memory: session and long-term recall. Recalls session history and long-term facts about the user or task.",
    links: [{ label: "Read more", url: "/develop/ai/context-engine/agent-memory" }],
  },
  contextRetriever: {
    label: "Context Retriever", type: "process", col: 1, row: 2, labelSide: "right",
    description: "Context Retriever: governed tool calls. Calls governed, schema-first tools to fetch business data the agent needs.",
    links: [{ label: "Read more", url: "/develop/ai/context-engine/context-retriever" }],
  },
  dataIntegration: {
    label: "Data Integration", type: "process", model: "rdi", col: 1, row: 3,
    description: "Data Integration: keeps business data fresh. Streams changes from source databases into the data layer Context Retriever queries.",
    links: [{ label: "Read more", url: "/develop/ai/context-engine/data-integration" }],
  },
  sourceDatabase: {
    label: "Source database", type: "external", model: "database", col: 0, row: 3,
    description: "Your existing database. Data Integration captures changes from it as they happen and streams them into Redis.",
    links: [{ label: "Prepare source databases", url: "/integrate/redis-data-integration/data-pipelines/prepare-dbs" }],
  },
  cachedResponse: {
    label: "Cached response", type: "terminal", model: "redis", col: 2, row: 0, labelSide: "back",
    description: "Return cached response: on a cache hit, LangCache returns the stored response directly, skipping the model call.",
    links: [],
  },
  modelCall: {
    label: "Model call", type: "process", col: 2, row: 1,
    description: "The model generates a response using the retrieved context.",
    links: [
      { label: "Google ADK", url: "/integrate/google-adk" },
      { label: "Amazon Bedrock", url: "/integrate/amazon-bedrock" },
      { label: "LangChain", url: "/integrate/langchain-redis" },
      { label: "More integrations", url: "/develop/ai/ecosystem-integrations" },
    ],
  },
  response: {
    label: "Response", type: "terminal", col: 3, row: 1,
    description: "The final response returned to the caller.",
    links: [],
  },
};

const EDGES = [
  { from: "agent", to: "langcache", kind: "normal", paths: ["cacheHit"] },
  { from: "langcache", to: "cachedResponse", kind: "branch", paths: ["cacheHit"] },
  { from: "agent", to: "agentMemory", kind: "normal", paths: ["memory"] },
  { from: "agentMemory", to: "modelCall", kind: "normal", paths: ["memory"] },
  { from: "agent", to: "contextRetriever", kind: "normal", label: "MCP", paths: ["context"] },
  { from: "sourceDatabase", to: "dataIntegration", kind: "normal", label: "Change data\ncapture", paths: ["context"] },
  { from: "dataIntegration", to: "contextRetriever", kind: "normal", paths: ["context"] },
  { from: "contextRetriever", to: "modelCall", kind: "normal", paths: ["context"] },
  { from: "modelCall", to: "response", kind: "normal", paths: ["memory", "context"] },
  { from: "response", to: "agentMemory", kind: "loopback", label: "App writes session event", paths: ["memory", "context"] },
];

const PATHS = {
  cacheHit: {
    label: "Cache hit: fastest",
    description: "LangCache finds a similar prompt already cached and returns it directly. No model call, so this path is the fastest and adds no LLM cost.",
  },
  memory: {
    label: "Needs memory: recalls session or long-term info",
    description: "For a question that depends on earlier turns or what's known about the user, Agent Memory supplies that recall before the model call.",
  },
  context: {
    label: "Needs business data: retrieves via Context Retriever",
    description: "For a question that depends on live business data, Context Retriever calls governed tools to fetch it before the model call. Data Integration keeps that data fresh.",
  },
};

const COLORS = {
  process: 0x2d4754,
  decision: 0xff4438,
  terminal: 0x8a99a0,
  surface: 0xffffff,
  edge: 0x8a99a0,
  active: 0x16a34a,
  selected: 0xff4438,
};

const COL_SPACING = 3.2;
const ROW_SPACING = 2.9;
const CUBE = 1.1;
const EDGE_Y = 0.1;
const HOVER_LIFT = 0.12;
const SELECT_LIFT = 0.35;
const DIM_OPACITY = 0.2;
const PULSES_PER_EDGE = 3;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function gridToWorld(col, row) {
  return new THREE.Vector3((col - 1.5) * COL_SPACING, 0, (row - 1.5) * ROW_SPACING);
}

function resolveUrl(basePath, path) {
  return basePath.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
}

// Distance from a cube's center to its side along a horizontal direction.
function distanceToCubeSide(dir) {
  return (CUBE / 2) / Math.max(Math.abs(dir.x), Math.abs(dir.z));
}

function edgeCurve(edge, nodes) {
  const a = nodes[edge.from].base;
  const b = nodes[edge.to].base;

  if (edge.kind === "loopback") {
    const top = CUBE + SELECT_LIFT + 0.1;
    const arch = top + 1.0;
    return new THREE.CubicBezierCurve3(
      new THREE.Vector3(a.x, top, a.z),
      new THREE.Vector3(a.x, arch, a.z),
      new THREE.Vector3(b.x, arch, b.z),
      new THREE.Vector3(b.x, top, b.z)
    );
  }

  const dir = new THREE.Vector3().subVectors(b, a).setY(0).normalize();
  const gap = distanceToCubeSide(dir) + 0.12;
  const start = a.clone().addScaledVector(dir, gap).setY(EDGE_Y);
  const end = b.clone().addScaledVector(dir, -gap).setY(EDGE_Y);
  return new THREE.LineCurve3(start, end);
}

function makeLabel(text, className) {
  const div = document.createElement("div");
  div.className = className;
  div.textContent = text;
  return { div, object: new CSS2DObject(div) };
}

function init(container) {
  const basePath = container.dataset.basePath || "/";
  const stage = container.querySelector(".diagram-3d-stage");
  const canvas = container.querySelector(".diagram-3d-canvas");
  const controlsBar = container.querySelector(".diagram-3d-controls");
  const panel = container.querySelector(".context-map-panel");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 15.5, 10);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = "diagram-3d-labels";
  stage.appendChild(labelRenderer.domElement);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0.4);
  controls.enableDamping = true;
  // Touch gets one-finger rotate and two-finger pan/pinch from OrbitControls.
  // Wheel and trackpad gestures are handled below instead, so they can't trap
  // page scrolling.
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  controls.screenSpacePanning = false;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = 1.2;
  controls.minAzimuthAngle = -1.0;
  controls.maxAzimuthAngle = 1.0;
  const baseDistance = camera.position.distanceTo(controls.target);
  controls.minDistance = baseDistance * 0.4;
  controls.maxDistance = baseDistance * 2.5;

  const PAN_LIMIT_X = 6;
  const PAN_LIMIT_Z = 5;
  controls.addEventListener("change", () => {
    const t = controls.target;
    const clamped = new THREE.Vector3(
      THREE.MathUtils.clamp(t.x, -PAN_LIMIT_X, PAN_LIMIT_X),
      0,
      THREE.MathUtils.clamp(t.z, -PAN_LIMIT_Z, PAN_LIMIT_Z)
    );
    if (!clamped.equals(t)) {
      camera.position.add(clamped.clone().sub(t));
      t.copy(clamped);
    }
  });

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c2c6, 1.8));
  // Upper left, and behind the camera's default position.
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-7, 14, 13);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 });
  sun.shadow.radius = 4;
  scene.add(sun);

  const surface = new THREE.Mesh(
    new THREE.BoxGeometry(12.5, 0.2, 11),
    new THREE.MeshStandardMaterial({ color: COLORS.surface, roughness: 0.9 })
  );
  surface.position.y = -0.1;
  surface.receiveShadow = true;
  scene.add(surface);

  const nodes = {};
  const hitBoxes = [];
  const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
  for (const [id, data] of Object.entries(NODES)) {
    const base = gridToWorld(data.col, data.row);
    const holder = new THREE.Group();
    holder.position.copy(base);

    const visual = data.model
      ? MODELS[data.model]()
      : new THREE.Mesh(
          new THREE.BoxGeometry(CUBE, CUBE, CUBE).translate(0, CUBE / 2, 0),
          new THREE.MeshStandardMaterial({ color: COLORS[data.type], roughness: 0.5, metalness: 0.05 })
        );
    const materials = [];
    visual.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      for (const material of [].concat(object.material)) {
        material.transparent = true;
        materials.push(material);
      }
    });
    holder.add(visual);

    // An invisible cube is the click target, so detailed models aren't fiddly to select.
    const hitBox = new THREE.Mesh(new THREE.BoxGeometry(CUBE, CUBE, CUBE), hitMaterial);
    hitBox.position.y = CUBE / 2;
    hitBox.userData.nodeId = id;
    holder.add(hitBox);
    hitBoxes.push(hitBox);

    // Labels sit on the surface in front of each node by default, leaving the
    // tops clear for the loopback arch. "back" keeps the band the arch passes
    // through free of text; "right" keeps a label off an edge arriving from the front.
    const label = makeLabel(data.label, "diagram-3d-label");
    if (data.labelSide === "back") {
      label.object.center.set(0.5, 1);
      label.object.position.set(0, CUBE, -CUBE / 2);
    } else if (data.labelSide === "right") {
      label.object.center.set(0, 0.5);
      label.object.position.set(CUBE / 2 + 0.15, 0, 0);
    } else {
      label.object.center.set(0.5, 0);
      label.object.position.set(0, 0, CUBE / 2 + 0.2);
    }
    holder.add(label.object);

    scene.add(holder);
    nodes[id] = { id, data, base, holder, materials, labelDiv: label.div, lift: 0, active: false, update: visual.userData.update };
  }

  const pulseGeometry = new THREE.SphereGeometry(0.09, 16, 16);
  const pulseMaterial = new THREE.MeshBasicMaterial({ color: COLORS.active });
  const edges = EDGES.map((edge) => {
    const curve = edgeCurve(edge, nodes);
    const material = new THREE.MeshStandardMaterial({ color: COLORS.edge, roughness: 0.6, transparent: true });
    const segments = edge.kind === "loopback" ? 64 : 1;
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, 0.04, 8, false), material);
    tube.castShadow = edge.kind === "loopback";
    scene.add(tube);

    const tangent = curve.getTangentAt(1);
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 16), material);
    arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
    arrow.position.copy(curve.getPointAt(1)).addScaledVector(tangent, -0.15);
    scene.add(arrow);

    let labelDiv = null;
    if (edge.label) {
      const label = makeLabel(edge.label, "diagram-3d-label diagram-3d-label--edge");
      label.object.position.copy(curve.getPointAt(0.5));
      if (edge.kind === "loopback") {
        label.object.position.y += 0.3;
      } else {
        label.object.center.set(0.5, 1);
      }
      scene.add(label.object);
      labelDiv = label.div;
    }

    const pulses = [];
    for (let i = 0; i < PULSES_PER_EDGE; i++) {
      const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
      pulse.visible = false;
      scene.add(pulse);
      pulses.push(pulse);
    }

    return { ...edge, curve, material, labelDiv, pulses };
  });

  let current = { type: null, id: null };
  let hoveredId = null;

  function activePath() {
    return current.type === "path" ? current.id : null;
  }

  function pathNodeIds(pathId) {
    const ids = new Set();
    for (const edge of edges) {
      if (edge.paths.includes(pathId)) {
        ids.add(edge.from);
        ids.add(edge.to);
      }
    }
    return ids;
  }

  function applyState() {
    const pathId = activePath();
    const inPath = pathId ? pathNodeIds(pathId) : null;

    for (const node of Object.values(nodes)) {
      const selected = current.type === "node" && current.id === node.id;
      const dimmed = inPath && !inPath.has(node.id);
      node.active = selected || Boolean(inPath && !dimmed);
      for (const material of node.materials) {
        material.opacity = dimmed ? DIM_OPACITY : 1;
        material.emissive.setHex(selected ? COLORS.selected : 0x000000);
        material.emissiveIntensity = selected ? 0.35 : 0;
      }
      node.labelDiv.classList.toggle("is-selected", selected);
      node.labelDiv.classList.toggle("is-path-active", Boolean(inPath && !dimmed));
      node.labelDiv.classList.toggle("is-dimmed", Boolean(dimmed));
    }

    for (const edge of edges) {
      const onPath = pathId && edge.paths.includes(pathId);
      edge.material.color.setHex(onPath ? COLORS.active : COLORS.edge);
      edge.material.opacity = pathId && !onPath ? DIM_OPACITY : 1;
      if (edge.labelDiv) edge.labelDiv.classList.toggle("is-dimmed", Boolean(pathId && !onPath));
      for (const pulse of edge.pulses) pulse.visible = Boolean(onPath) && !reducedMotion;
    }

    for (const [id, button] of Object.entries(pathButtons)) {
      const active = id === pathId;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  }

  function showPanel(kind, title, description, links) {
    panel.textContent = "";
    panel.className = "context-map-panel context-map-panel--" + kind;

    const eyebrow = document.createElement("span");
    eyebrow.className = "context-map-panel-kind";
    eyebrow.textContent = kind === "path" ? "Scenario" : "Component";
    panel.appendChild(eyebrow);

    const heading = document.createElement("strong");
    heading.textContent = title;
    panel.appendChild(heading);

    const desc = document.createElement("p");
    desc.textContent = description;
    panel.appendChild(desc);

    links.forEach((link, i) => {
      if (i > 0) panel.appendChild(document.createTextNode(" · "));
      const a = document.createElement("a");
      a.href = resolveUrl(basePath, link.url);
      a.textContent = link.label;
      panel.appendChild(a);
    });

    panel.hidden = false;
  }

  function select(type, id) {
    if (current.type === type && current.id === id) {
      current = { type: null, id: null };
      panel.hidden = true;
    } else {
      current = { type, id };
      if (type === "node") {
        const data = NODES[id];
        showPanel("node", data.label, data.description, data.links);
      } else {
        showPanel("path", PATHS[id].label, PATHS[id].description, []);
      }
    }
    applyState();
  }

  const pathButtons = {};
  for (const [id, path] of Object.entries(PATHS)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "context-map-path-button";
    button.textContent = path.label;
    button.addEventListener("click", () => select("path", id));
    controlsBar.appendChild(button);
    pathButtons[id] = button;
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function pick(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const [hit] = raycaster.intersectObjects(hitBoxes, false);
    return hit ? hit.object.userData.nodeId : null;
  }

  // OrbitControls also listens for pointer events, so only treat a press as a
  // click when the pointer barely moved; otherwise it was a rotate drag.
  let downAt = null;
  let engaged = false;
  canvas.addEventListener("pointerdown", (event) => {
    downAt = { x: event.clientX, y: event.clientY };
    engaged = true;
  });
  stage.addEventListener("pointerleave", () => {
    engaged = false;
  });
  canvas.addEventListener("pointerup", (event) => {
    if (!downAt) return;
    const moved = Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y);
    downAt = null;
    if (moved > 5) return;
    const id = pick(event);
    if (id) {
      select("node", id);
    } else if (current.type === "node") {
      select("node", current.id);
    }
  });
  canvas.addEventListener("pointermove", (event) => {
    if (downAt) return;
    hoveredId = pick(event);
    canvas.style.cursor = hoveredId ? "pointer" : "grab";
  });
  canvas.addEventListener("pointerleave", () => {
    hoveredId = null;
  });

  function zoomBy(factor) {
    const offset = camera.position.clone().sub(controls.target);
    const length = THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance);
    camera.position.copy(controls.target).add(offset.setLength(length));
    controls.update();
  }

  // Moves the view along the surface so the content follows the fingers.
  function panBy(dx, dy) {
    const distance = camera.position.distanceTo(controls.target);
    const perPixel = (2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / stage.clientHeight;
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0).setY(0).normalize();
    const forward = new THREE.Vector3().crossVectors(camera.up, right);
    const move = right.multiplyScalar(dx * perPixel).addScaledVector(forward, -dy * perPixel);
    controls.target.add(move);
    camera.position.add(move);
    controls.update();
  }

  // A trackpad pinch arrives as a wheel event with ctrlKey set. A two-finger
  // drag is indistinguishable from a mouse wheel, so it only pans once the
  // reader has clicked or dragged in the diagram; until then it scrolls the page.
  // Capture phase, so OrbitControls' own wheel zoom on the canvas never runs.
  stage.addEventListener("wheel", (event) => {
    event.stopPropagation();
    const scale = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : 1;
    if (event.ctrlKey) {
      event.preventDefault();
      zoomBy(Math.exp(event.deltaY * scale * 0.01));
    } else if (engaged) {
      event.preventDefault();
      panBy(event.deltaX * scale, event.deltaY * scale);
    }
  }, { capture: true, passive: false });

  // Safari reports trackpad pinches as gesture events, not ctrl+wheel.
  let gestureScale = 1;
  stage.addEventListener("gesturestart", (event) => {
    event.preventDefault();
    gestureScale = 1;
  });
  stage.addEventListener("gesturechange", (event) => {
    event.preventDefault();
    zoomBy(gestureScale / event.scale);
    gestureScale = event.scale;
  });

  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    // Back the camera off on narrow screens so the whole graph stays in view.
    const offset = camera.position.clone().sub(controls.target);
    offset.setLength(baseDistance * Math.max(1, 1.8 / camera.aspect));
    camera.position.copy(controls.target).add(offset);
    renderer.setSize(width, height, false);
    labelRenderer.setSize(width, height);
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  const clock = new THREE.Clock();
  let visible = false;
  let frameId = null;

  function frame() {
    if (!visible) {
      frameId = null;
      return;
    }
    const dt = clock.getDelta();
    const elapsed = clock.elapsedTime;
    controls.update();

    for (const node of Object.values(nodes)) {
      const selected = current.type === "node" && current.id === node.id;
      const target = selected ? SELECT_LIFT : node.id === hoveredId ? HOVER_LIFT : 0;
      node.lift += (target - node.lift) * Math.min(1, dt * 10);
      node.holder.position.y = node.lift;
      if (node.update && !reducedMotion) node.update({ dt, active: node.active });
    }

    for (const edge of edges) {
      edge.pulses.forEach((pulse, i) => {
        if (!pulse.visible) return;
        const t = (elapsed * 0.45 + i / PULSES_PER_EDGE) % 1;
        pulse.position.copy(edge.curve.getPointAt(t));
      });
    }

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    frameId = requestAnimationFrame(frame);
  }

  // Stop rendering while the diagram is scrolled out of view.
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && frameId === null) {
      clock.getDelta();
      frameId = requestAnimationFrame(frame);
    }
  }).observe(stage);

  applyState();
}

document.querySelectorAll('.diagram-3d-container[data-diagram="iris-request-flow-3d"]').forEach(init);
