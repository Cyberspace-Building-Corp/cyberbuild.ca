// ============================================
// CYBERBUILD.CA — Three.js Scene
// 3D service graph: wireframe spheres, icons, particles, camera
// ============================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { ServiceMap, ServiceKey, GraphLayout } from './types';
import { drawIcon, type IconType } from './icons';

// --- Material helpers ---
function lineMat(color: number, opacity: number): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity });
}
function fillMat(color: number, opacity: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide });
}
function pointMat(color: number, size: number, opacity: number): THREE.PointsMaterial {
  return new THREE.PointsMaterial({ color, size, transparent: true, opacity, blending: THREE.AdditiveBlending });
}

// --- Icon texture from canvas ---
function makeIconTexture(key: IconType, color: string, size = 512): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.shadowColor = color;
  ctx.shadowBlur = (size / 10) * 1.2;
  drawIcon(ctx, key, color, size);
  const tex = new THREE.CanvasTexture(cv);
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

// --- Exported scene state ---
export interface SceneState {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  nodeGroups: Record<string, THREE.Group>;
  nodeData: Record<string, { pos: THREE.Vector3; r: number }>;
  hitTargets: THREE.Mesh[];
  edgeLines: THREE.Line[];
  sparkleGeo: THREE.BufferGeometry;
  sparkleVelocities: Array<{ x: number; y: number; z: number }>;
  sparklePts: THREE.Points;
  sparkleCount: number;
  defaultPosition: THREE.Vector3;
  defaultTarget: THREE.Vector3;
  overviewDistance: number;
  selectNode: (key: ServiceKey) => void;
  closeOverlay: () => void;
  showContact: () => void;
}

export function createScene(
  canvas: HTMLCanvasElement,
  services: ServiceMap,
  layout: GraphLayout
): SceneState {
  const { nodes, edges, camera: camCfg, colors, particles } = layout;

  // --- Renderer ---
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000006);

  // --- Scene ---
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000006, 28, 55);

  // --- Camera ---
  const camera = new THREE.PerspectiveCamera(
    camCfg.fov,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  camera.position.set(...camCfg.defaultPosition);

  // --- Controls ---
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.04;
  controls.enablePan = false;
  controls.target.set(...camCfg.defaultTarget);
  controls.autoRotate = true;
  controls.autoRotateSpeed = camCfg.autoRotateSpeed;
  controls.maxPolarAngle = Math.PI * 0.5;
  controls.minPolarAngle = Math.PI * 0.1;
  controls.minDistance = camCfg.minDistance;
  controls.maxDistance = camCfg.maxDistance;

  // --- Parse colors ---
  const MESH_COLOR = parseInt(colors.meshBase.replace('#', ''), 16);
  const MESH_BRIGHT = parseInt(colors.meshBright.replace('#', ''), 16);
  const MESH_DIM = parseInt(colors.meshDim.replace('#', ''), 16);
  const EDGE_COLOR = parseInt(colors.edge.replace('#', ''), 16);

  // --- Build world ---
  const world = new THREE.Group();
  const hitTargets: THREE.Mesh[] = [];
  const nodeGroups: Record<string, THREE.Group> = {};
  const nodeData: Record<string, { pos: THREE.Vector3; r: number }> = {};

  nodes.forEach((def) => {
    const { key, position: pos, radius: r } = def;
    const svc = services[key];
    const g = new THREE.Group();
    g.position.set(...pos);

    // Wireframe sphere
    const outer = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(r, 2)),
      lineMat(MESH_COLOR, 0.3)
    );
    g.add(outer);

    // Inner glow
    g.add(new THREE.Mesh(
      new THREE.SphereGeometry(r * 0.9, 16, 12),
      fillMat(MESH_DIM, 0.02)
    ));

    // Icon sprite
    const iconTex = makeIconTexture(key as IconType, svc.iconColor, 512);
    const iconSpr = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: iconTex, transparent: true, opacity: 0.9, depthTest: false })
    );
    iconSpr.scale.setScalar(r * 1.5);
    g.add(iconSpr);

    // Center dot
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
    g.add(new THREE.Points(dg, pointMat(0xffffff, 0.07, 0.4)));

    // Hitbox
    const hb = new THREE.Mesh(
      new THREE.SphereGeometry(r, 12, 12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    g.add(hb);

    g.userData = { serviceKey: key, hitbox: hb, outer };
    hitTargets.push(hb);
    nodeGroups[key] = g;
    nodeData[key] = { pos: new THREE.Vector3(...pos), r };
    world.add(g);
  });

  // --- Edges ---
  const edgeLines: THREE.Line[] = [];
  edges.forEach(([a, b]) => {
    const s = new THREE.Vector3(...nodes[a].position);
    const e = new THREE.Vector3(...nodes[b].position);
    const m = s.clone().add(e).multiplyScalar(0.5);
    m.y += 0.4 + Math.random() * 0.5;
    const curve = new THREE.QuadraticBezierCurve3(s, m, e);
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(20)),
      lineMat(EDGE_COLOR, 0.18)
    );
    world.add(line);
    edgeLines.push(line);
  });

  // --- Particles ---
  const sparkleCount = particles.sparkleCount;
  const sparklePos = new Float32Array(sparkleCount * 3);
  const sparkleVelocities: Array<{ x: number; y: number; z: number }> = [];
  for (let i = 0; i < sparkleCount; i++) {
    sparklePos[i * 3] = (Math.random() - 0.5) * 20;
    sparklePos[i * 3 + 1] = -5 + Math.random() * 16;
    sparklePos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    sparkleVelocities.push({
      x: (Math.random() - 0.5) * 0.005,
      y: 0.002 + Math.random() * 0.008,
      z: (Math.random() - 0.5) * 0.005,
    });
  }
  const sparkleGeo = new THREE.BufferGeometry();
  sparkleGeo.setAttribute('position', new THREE.Float32BufferAttribute(sparklePos, 3));
  const sparklePts = new THREE.Points(sparkleGeo, pointMat(MESH_BRIGHT, 0.045, 0.5));
  world.add(sparklePts);

  // Dust
  const dustCount = particles.dustCount;
  const dustP = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustP[i * 3] = (Math.random() - 0.5) * 22;
    dustP[i * 3 + 1] = -4 + Math.random() * 14;
    dustP[i * 3 + 2] = (Math.random() - 0.5) * 22;
  }
  world.add(new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(dustP, 3)),
    pointMat(0x1a1a44, 0.02, 0.15)
  ));

  scene.add(world);

  const defaultPosition = new THREE.Vector3(...camCfg.defaultPosition);
  const defaultTarget = new THREE.Vector3(...camCfg.defaultTarget);

  return {
    renderer,
    scene,
    camera,
    controls,
    nodeGroups,
    nodeData,
    hitTargets,
    edgeLines,
    sparkleGeo,
    sparkleVelocities,
    sparklePts,
    sparkleCount,
    defaultPosition,
    defaultTarget,
    overviewDistance: camCfg.overviewDistance,
    selectNode: () => {},  // Wired in main.ts
    closeOverlay: () => {}, // Wired in main.ts
    showContact: () => {},  // Wired in main.ts
  };
}

// --- Animation loop ---
export function startAnimationLoop(state: SceneState): void {
  const clock = new THREE.Clock();

  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Sphere breathing
    Object.values(state.nodeGroups).forEach((ng, i) => {
      const s = 1 + Math.sin(t * 0.6 + i * 1.1) * 0.015;
      (ng.userData as any).outer.scale.setScalar(s);
    });

    // Sparkle drift + twinkle
    const sp = state.sparkleGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < state.sparkleCount; i++) {
      sp[i * 3] += state.sparkleVelocities[i].x;
      sp[i * 3 + 1] += state.sparkleVelocities[i].y;
      sp[i * 3 + 2] += state.sparkleVelocities[i].z;
      if (sp[i * 3 + 1] > 12) {
        sp[i * 3 + 1] = -5;
        sp[i * 3] = (Math.random() - 0.5) * 20;
        sp[i * 3 + 2] = (Math.random() - 0.5) * 20;
      }
      if (Math.abs(sp[i * 3]) > 12) state.sparkleVelocities[i].x *= -1;
      if (Math.abs(sp[i * 3 + 2]) > 12) state.sparkleVelocities[i].z *= -1;
    }
    state.sparkleGeo.attributes.position.needsUpdate = true;
    (state.sparklePts.material as THREE.PointsMaterial).opacity = 0.35 + Math.sin(t * 2) * 0.15;
    (state.sparklePts.material as THREE.PointsMaterial).size = 0.04 + Math.sin(t * 3) * 0.015;

    state.controls.update();
    state.renderer.render(state.scene, state.camera);
  })();
}

// --- Camera animation ---
export function animateCamera(
  state: SceneState,
  targetPos: THREE.Vector3,
  targetLook: THREE.Vector3,
  duration = 900,
  onComplete?: () => void
): void {
  const startPos = state.camera.position.clone();
  const startTarget = state.controls.target.clone();
  const t0 = performance.now();
  state.controls.autoRotate = false;

  (function step(now: number) {
    const r = Math.min((now - t0) / duration, 1);
    const e = r < 0.5 ? 4 * r * r * r : 1 - Math.pow(-2 * r + 2, 3) / 2; // easeInOutCubic
    state.camera.position.lerpVectors(startPos, targetPos, e);
    state.controls.target.lerpVectors(startTarget, targetLook, e);
    state.controls.update();
    if (r < 1) {
      requestAnimationFrame(step);
    } else {
      onComplete?.();
    }
  })(performance.now());
}

// --- Resize handler ---
export function handleResize(state: SceneState): void {
  state.renderer.setSize(window.innerWidth, window.innerHeight);
  state.camera.aspect = window.innerWidth / window.innerHeight;
  state.camera.updateProjectionMatrix();
}
