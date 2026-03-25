// ============================================
// CYBERBUILD.CA — Star Field Scene
// Ambient Three.js background: drifting star particles
// No user interaction — purely atmospheric
// ============================================

import * as THREE from 'three';

export interface StarState {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  sparkleGeo: THREE.BufferGeometry;
  sparkleVelocities: Array<{ x: number; y: number; z: number }>;
  sparklePts: THREE.Points;
  sparkleCount: number;
}

export function createStarScene(canvas: HTMLCanvasElement): StarState {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x050a14);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x050a14, 35, 65);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 18);

  // --- Primary star particles ---
  const sparkleCount = 600;
  const sparklePos = new Float32Array(sparkleCount * 3);
  const sparkleVelocities: Array<{ x: number; y: number; z: number }> = [];

  for (let i = 0; i < sparkleCount; i++) {
    sparklePos[i * 3]     = (Math.random() - 0.5) * 50;
    sparklePos[i * 3 + 1] = (Math.random() - 0.5) * 35;
    sparklePos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    sparkleVelocities.push({
      x: (Math.random() - 0.5) * 0.004,
      y: (Math.random() - 0.5) * 0.003 + 0.001,
      z: (Math.random() - 0.5) * 0.004,
    });
  }

  const sparkleGeo = new THREE.BufferGeometry();
  sparkleGeo.setAttribute('position', new THREE.Float32BufferAttribute(sparklePos, 3));
  const sparkleMat = new THREE.PointsMaterial({
    color: 0x99ccff,
    size: 0.06,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sparklePts = new THREE.Points(sparkleGeo, sparkleMat);
  scene.add(sparklePts);

  // --- Dust layer (denser, dimmer) ---
  const dustCount = 900;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3]     = (Math.random() - 0.5) * 60;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 45;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 60;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dustPos, 3));
  scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: 0x1a2a4a,
    size: 0.025,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })));

  return { renderer, scene, camera, sparkleGeo, sparkleVelocities, sparklePts, sparkleCount };
}

export function startStarLoop(state: StarState): void {
  const clock = new THREE.Clock();

  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Gentle camera drift — gives depth to the star field
    state.camera.position.x = Math.sin(t * 0.04) * 1.5;
    state.camera.position.y = Math.sin(t * 0.025) * 0.8;
    state.camera.lookAt(0, 0, 0);

    // Sparkle drift + twinkle
    const sp = state.sparkleGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < state.sparkleCount; i++) {
      sp[i * 3]     += state.sparkleVelocities[i].x;
      sp[i * 3 + 1] += state.sparkleVelocities[i].y;
      sp[i * 3 + 2] += state.sparkleVelocities[i].z;

      // Wrap bounds
      if (Math.abs(sp[i * 3]) > 25)     { sp[i * 3]     = (Math.random() - 0.5) * 50; }
      if (sp[i * 3 + 1] > 18)            { sp[i * 3 + 1] = -18; sp[i * 3] = (Math.random() - 0.5) * 50; sp[i * 3 + 2] = (Math.random() - 0.5) * 50; }
      if (sp[i * 3 + 1] < -18)           { sp[i * 3 + 1] = 18; }
      if (Math.abs(sp[i * 3 + 2]) > 25)  { sp[i * 3 + 2] = (Math.random() - 0.5) * 50; }
    }
    state.sparkleGeo.attributes.position.needsUpdate = true;
    (state.sparklePts.material as THREE.PointsMaterial).opacity = 0.35 + Math.sin(t * 1.8) * 0.12;
    (state.sparklePts.material as THREE.PointsMaterial).size    = 0.055 + Math.sin(t * 2.8) * 0.015;

    state.renderer.render(state.scene, state.camera);
  })();
}

export function handleStarResize(state: StarState): void {
  state.renderer.setSize(window.innerWidth, window.innerHeight);
  state.camera.aspect = window.innerWidth / window.innerHeight;
  state.camera.updateProjectionMatrix();
}
