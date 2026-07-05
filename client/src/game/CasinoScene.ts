import * as THREE from 'three';

export interface CasinoScene {
  dispose: () => void;
}

export function createCasino(canvas: HTMLCanvasElement): CasinoScene {
  // ===== SCENE =====
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1015);
  scene.fog = new THREE.FogExp2(0x1a1015, 0.012);

  // ===== CAMERA =====
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(0, 1.7, 18);

  // ===== RENDERER =====
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  // ===== MATERIALS =====
  const matFloor = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.3, metalness: 0.4 });
  const matMarbleWhite = new THREE.MeshStandardMaterial({ color: 0xe8e0d5, roughness: 0.15, metalness: 0.1 });
  const matMarbleBlack = new THREE.MeshStandardMaterial({ color: 0x1a1614, roughness: 0.15, metalness: 0.1 });
  const matWall = new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.8 });
  const matCeiling = new THREE.MeshStandardMaterial({ color: 0x0d0806, roughness: 0.9 });
  const matGold = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.9, emissive: 0x554400, emissiveIntensity: 0.3 });
  const matRedCarpet = new THREE.MeshStandardMaterial({ color: 0x4a0808, roughness: 0.95 });
  const matFeltGreen = new THREE.MeshStandardMaterial({ color: 0x0a3a1a, roughness: 0.9 });
  const matDarkWood = new THREE.MeshStandardMaterial({ color: 0x1a0e08, roughness: 0.6, metalness: 0.2 });
  const matGlowRed = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff1a1a, emissiveIntensity: 1.5, roughness: 0.3 });
  const matGlowGold = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 1.2 });
  const matGlowBlue = new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x0044ff, emissiveIntensity: 1.5 });
  const matGlowPink = new THREE.MeshStandardMaterial({ color: 0xff00aa, emissive: 0xff0088, emissiveIntensity: 1.5 });

  // ===== ROOM DIMENSIONS =====
  const ROOM_W = 50;
  const ROOM_H = 12;
  const ROOM_D = 50;

  // ===== BUILD FLOOR (checkered marble) =====
  const tileSize = 5;
  for (let x = -ROOM_W / 2; x < ROOM_W / 2; x += tileSize) {
    for (let z = -ROOM_D / 2; z < ROOM_D / 2; z += tileSize) {
      const isWhite = ((x + z) / tileSize) % 2 === 0;
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(tileSize, 0.05, tileSize),
        isWhite ? matMarbleWhite : matMarbleBlack
      );
      tile.position.set(x + tileSize / 2, 0, z + tileSize / 2);
      tile.receiveShadow = true;
      scene.add(tile);
    }
  }

  // ===== RED CARPET RUNWAY =====
  const carpet = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.06, ROOM_D),
    matRedCarpet
  );
  carpet.position.set(0, 0.03, 0);
  carpet.receiveShadow = true;
  scene.add(carpet);

  // Gold carpet borders
  for (const xPos of [-3.1, 3.1]) {
    const border = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.07, ROOM_D),
      matGold
    );
    border.position.set(xPos, 0.04, 0);
    scene.add(border);
  }

  // ===== WALLS =====
  // Back wall
  const wallBack = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, ROOM_H, 0.4), matWall);
  wallBack.position.set(0, ROOM_H / 2, -ROOM_D / 2);
  wallBack.receiveShadow = true;
  scene.add(wallBack);

  // Front wall
  const wallFront = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, ROOM_H, 0.4), matWall);
  wallFront.position.set(0, ROOM_H / 2, ROOM_D / 2);
  wallFront.receiveShadow = true;
  scene.add(wallFront);

  // Side walls
  const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, ROOM_H, ROOM_D), matWall);
  wallLeft.position.set(-ROOM_W / 2, ROOM_H / 2, 0);
  wallLeft.receiveShadow = true;
  scene.add(wallLeft);

  const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.4, ROOM_H, ROOM_D), matWall);
  wallRight.position.set(ROOM_W / 2, ROOM_H / 2, 0);
  wallRight.receiveShadow = true;
  scene.add(wallRight);

  // ===== CEILING =====
  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 0.4, ROOM_D), matCeiling);
  ceiling.position.set(0, ROOM_H, 0);
  scene.add(ceiling);

  // ===== WALL DECORATIONS (gold trim + neon) =====
  // Gold trim at top of walls
  for (const [y] of [[9]]) {
    const trimBack = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 0.3, 0.5), matGold);
    trimBack.position.set(0, y, -ROOM_D / 2 + 0.3);
    scene.add(trimBack);
    const trimFront = trimBack.clone();
    trimFront.position.z = ROOM_D / 2 - 0.3;
    scene.add(trimFront);
    const trimLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, ROOM_D), matGold);
    trimLeft.position.set(-ROOM_W / 2 + 0.3, y, 0);
    scene.add(trimLeft);
    const trimRight = trimLeft.clone();
    trimRight.position.x = ROOM_W / 2 - 0.3;
    scene.add(trimRight);
  }

  // Neon strips
  const neonColors = [matGlowRed, matGlowBlue, matGlowGold, matGlowPink];
  for (let i = 0; i < 8; i++) {
    const neon = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.15, 0.15),
      neonColors[i % neonColors.length]
    );
    neon.position.set(-20 + i * 6, 7.5, -ROOM_D / 2 + 0.3);
    scene.add(neon);
  }
  // Side neon
  for (let i = 0; i < 8; i++) {
    const neon = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.15, 3),
      neonColors[(i + 2) % neonColors.length]
    );
    neon.position.set(-ROOM_W / 2 + 0.3, 7.5, -20 + i * 6);
    scene.add(neon);
    const neonR = neon.clone();
    neonR.position.x = ROOM_W / 2 - 0.3;
    neonR.material = neonColors[(i + 1) % neonColors.length];
    scene.add(neonR);
  }

  // ===== CHANDELIERS =====
  for (const [x, z] of [[-12, -12], [12, -12], [-12, 12], [12, 12], [0, 0]]) {
    // Chain
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3), matGold);
    chain.position.set(x, ROOM_H - 1.5, z);
    scene.add(chain);

    // Main chandelier body
    const chandelier = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 16, 12),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffaa00,
        emissiveIntensity: 2.5,
        roughness: 0.1,
        metalness: 0.9,
      })
    );
    chandelier.position.set(x, ROOM_H - 3.5, z);
    scene.add(chandelier);

    // Chandelier rings
    for (let r = 0; r < 3; r++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.5 + r * 0.4, 0.06, 8, 24),
        matGold
      );
      ring.position.set(x, ROOM_H - 3.5 - r * 0.2, z);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
    }

    // Point light from chandelier
    const chLight = new THREE.PointLight(0xffd080, 2.5, 25, 1.5);
    chLight.position.set(x, ROOM_H - 3.5, z);
    chLight.castShadow = true;
    chLight.shadow.mapSize.set(512, 512);
    scene.add(chLight);
  }

  // ===== SLOT MACHINES (rows) =====
  const slotColors = [
    { cabinet: 0x1a0808, screen: 0xff0000, glow: matGlowRed },
    { cabinet: 0x08101a, screen: 0x00aaff, glow: matGlowBlue },
    { cabinet: 0x1a1a08, screen: 0xffd700, glow: matGlowGold },
    { cabinet: 0x1a0818, screen: 0xff00ff, glow: matGlowPink },
  ];

  // Two rows of slots on the left side
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 5; i++) {
      const sc = slotColors[(i + row) % slotColors.length];
      const slot = createSlotMachine(sc.cabinet, sc.screen, sc.glow);
      slot.position.set(
        -18 + row * 3,
        0,
        -14 + i * 4
      );
      slot.rotation.y = row === 0 ? Math.PI / 2 : -Math.PI / 2;
      scene.add(slot);
    }
  }

  // Two rows on the right side
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 5; i++) {
      const sc = slotColors[(i + row + 2) % slotColors.length];
      const slot = createSlotMachine(sc.cabinet, sc.screen, sc.glow);
      slot.position.set(
        15 + row * 3,
        0,
        -14 + i * 4
      );
      slot.rotation.y = row === 0 ? -Math.PI / 2 : Math.PI / 2;
      scene.add(slot);
    }
  }

  function createSlotMachine(cabinetColor: number, screenColor: number, glowMat: THREE.Material) {
    const group = new THREE.Group();

    // Cabinet body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2.8, 1.0),
      new THREE.MeshStandardMaterial({ color: cabinetColor, roughness: 0.4, metalness: 0.6 })
    );
    body.position.y = 1.4;
    body.castShadow = true;
    group.add(body);

    // Top crown
    const crown = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.3, 1.1),
      matGold
    );
    crown.position.y = 2.95;
    group.add(crown);

    // Screen (glowing)
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.7, 0.05),
      new THREE.MeshStandardMaterial({
        color: screenColor,
        emissive: screenColor,
        emissiveIntensity: 1.8,
      })
    );
    screen.position.set(0, 2.1, 0.52);
    group.add(screen);

    // Reel area
    const reelArea = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.6, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x110011, emissiveIntensity: 0.3 })
    );
    reelArea.position.set(0, 1.3, 0.52);
    group.add(reelArea);

    // Reel symbols (3 small glowing dots)
    for (let r = 0; r < 3; r++) {
      const symbol = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.4, 0.03),
        glowMat
      );
      symbol.position.set(-0.28 + r * 0.28, 1.3, 0.55);
      group.add(symbol);
    }

    // Coin slot
    const coinSlot = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.05, 0.05),
      matGold
    );
    coinSlot.position.set(0, 0.8, 0.52);
    group.add(coinSlot);

    // Base
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.2, 1.1),
      matDarkWood
    );
    base.position.y = 0.1;
    group.add(base);

    // Small spot light above machine
    const slotLight = new THREE.SpotLight(0xffaa44, 1.2, 6, Math.PI / 5, 0.5);
    slotLight.position.set(0, 3.5, 0);
    slotLight.target.position.set(0, 1.5, 0);
    group.add(slotLight);
    group.add(slotLight.target);

    return group;
  }

  // ===== CARD TABLES =====
  // Blackjack table
  const bjTable = createCardTable('blackjack');
  bjTable.position.set(-7, 0, 5);
  scene.add(bjTable);

  const bjTable2 = createCardTable('blackjack');
  bjTable2.position.set(7, 0, 5);
  scene.add(bjTable2);

  // Poker table
  const pokerTable = createCardTable('poker');
  pokerTable.position.set(-7, 0, 14);
  scene.add(pokerTable);

  function createCardTable(type: string) {
    const group = new THREE.Group();

    // Table top (oval using scaled cylinder)
    const tableTop = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 0.15, 24),
      matFeltGreen
    );
    tableTop.position.y = 1.0;
    tableTop.scale.z = 0.6;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    group.add(tableTop);

    // Gold trim around table edge
    const trim = new THREE.Mesh(
      new THREE.TorusGeometry(2.5, 0.1, 8, 24),
      matGold
    );
    trim.position.y = 1.0;
    trim.rotation.x = Math.PI / 2;
    trim.scale.z = 0.6;
    group.add(trim);

    // Wooden base
    const tableBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.6, 1.0, 12),
      matDarkWood
    );
    tableBase.position.y = 0.5;
    tableBase.castShadow = true;
    group.add(tableBase);

    // Dealer sign
    const signMat = type === 'blackjack'
      ? new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8 })
      : new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.8 });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.02), signMat);
    sign.position.set(0, 1.15, 1.5);
    sign.scale.z = 0.6;
    group.add(sign);

    // Overhead light
    const light = new THREE.SpotLight(0xfff0dd, 3, 8, Math.PI / 4, 0.4);
    light.position.set(0, 4, 0);
    light.target.position.set(0, 1, 0);
    light.castShadow = true;
    group.add(light);
    group.add(light.target);

    return group;
  }

  // ===== ROULETTE TABLE =====
  const roulette = new THREE.Group();

  // Wheel base
  const wheelBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.4, 0.8, 24),
    matDarkWood
  );
  wheelBase.position.y = 0.4;
  roulette.add(wheelBase);

  // Wheel
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a0a04, roughness: 0.3, metalness: 0.7 });
  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.0, 0.15, 32),
    wheelMat
  );
  wheel.position.y = 0.9;
  roulette.add(wheel);

  // Gold wheel border
  const wheelGold = new THREE.Mesh(
    new THREE.TorusGeometry(1.0, 0.08, 8, 32),
    matGold
  );
  wheelGold.position.y = 0.98;
  wheelGold.rotation.x = Math.PI / 2;
  roulette.add(wheelGold);

  // Center cone
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 0.3, 8),
    matGold
  );
  cone.position.y = 1.05;
  roulette.add(cone);

  // Betting table
  const betTable = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.1, 2.5),
    matFeltGreen
  );
  betTable.position.set(0, 0.8, 2.5);
  betTable.castShadow = true;
  roulette.add(betTable);

  roulette.position.set(0, 0, 14);
  scene.add(roulette);

  // Overhead light for roulette
  const rLight = new THREE.SpotLight(0xfff0dd, 3, 8, Math.PI / 4, 0.4);
  rLight.position.set(0, 4, 14);
  rLight.target.position.set(0, 1, 14);
  scene.add(rLight);
  scene.add(rLight.target);

  // ===== ENTRANCE ARCH =====
  const archLeft = new THREE.Mesh(new THREE.BoxGeometry(1.5, 8, 0.8), matGold);
  archLeft.position.set(-5, 4, ROOM_D / 2 - 0.5);
  scene.add(archLeft);

  const archRight = new THREE.Mesh(new THREE.BoxGeometry(1.5, 8, 0.8), matGold);
  archRight.position.set(5, 4, ROOM_D / 2 - 0.5);
  scene.add(archRight);

  const archTop = new THREE.Mesh(new THREE.BoxGeometry(11.5, 1.2, 0.8), matGold);
  archTop.position.set(0, 8, ROOM_D / 2 - 0.5);
  scene.add(archTop);

  // ===== BAR (back wall area) =====
  const barTop = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.2, 1.5),
    matMarbleBlack
  );
  barTop.position.set(0, 1.2, -ROOM_D / 2 + 2);
  scene.add(barTop);

  const barFront = new THREE.Mesh(
    new THREE.BoxGeometry(12, 1.2, 0.3),
    matDarkWood
  );
  barFront.position.set(0, 0.6, -ROOM_D / 2 + 1.4);
  scene.add(barFront);

  // Bar shelves with glowing bottles
  for (let i = 0; i < 10; i++) {
    const bottleColor = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff][i % 6];
    const bottle = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.8, 0.3),
      new THREE.MeshStandardMaterial({
        color: bottleColor,
        emissive: bottleColor,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.8,
      })
    );
    bottle.position.set(-5 + i * 1.1, 2.5, -ROOM_D / 2 + 1.5);
    scene.add(bottle);
  }

  // ===== PILLARS WITH GOLD DETAILS =====
  const pillarPositions: [number, number][] = [
    [-16, -16], [16, -16], [-16, 16], [16, 16],
    [-16, 0], [16, 0],
  ];

  for (const [px, pz] of pillarPositions) {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, ROOM_H, 12),
      matMarbleWhite
    );
    pillar.position.set(px, ROOM_H / 2, pz);
    pillar.castShadow = true;
    scene.add(pillar);

    // Gold base
    const pillarBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.2, 0.5, 12),
      matGold
    );
    pillarBase.position.set(px, 0.25, pz);
    scene.add(pillarBase);

    // Gold capital
    const pillarCap = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 0.9, 0.5, 12),
      matGold
    );
    pillarCap.position.set(px, ROOM_H - 0.25, pz);
    scene.add(pillarCap);
  }

  // ===== AMBIENT LIGHTING =====
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  // Hemisphere light for general fill
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
  scene.add(hemi);

  // Main directional light
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  dirLight.shadow.camera.left = -30;
  dirLight.shadow.camera.right = 30;
  dirLight.shadow.camera.top = 30;
  dirLight.shadow.camera.bottom = -30;
  scene.add(dirLight);

  // ===== FIRST PERSON CONTROLS =====
  const player = {
    velocity: new THREE.Vector3(),
    onGround: true,
  };

  const keys: Record<string, boolean> = {};
  let isLocked = false;
  let yaw = Math.PI; // facing into room (towards -Z)
  let pitch = 0;

  // Collision bounds (keep player inside walls)
  const BOUND_X = ROOM_W / 2 - 1.5;
  const BOUND_Z = ROOM_D / 2 - 1.5;

  function onKeyDown(e: KeyboardEvent) {
    keys[e.code] = true;
  }
  function onKeyUp(e: KeyboardEvent) {
    keys[e.code] = false;
  }
  function onMouseMove(e: MouseEvent) {
    if (!isLocked) return;
    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;
    pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, pitch));
  }
  function onLockChange() {
    isLocked = document.pointerLockElement === canvas;
    window.dispatchEvent(new CustomEvent('casino:pointerlock', { detail: isLocked }));
  }

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('pointerlockchange', onLockChange);

  canvas.addEventListener('click', () => {
    if (!isLocked) canvas.requestPointerLock();
  });

  // ===== RESIZE =====
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  // ===== ANIMATION LOOP =====
  const clock = new THREE.Clock();
  let animId = 0;

  function animate() {
    animId = requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1);

    // Movement
    const speed = 7;
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

    const move = new THREE.Vector3();
    if (keys['KeyW'] || keys['ArrowUp']) move.add(forward);
    if (keys['KeyS'] || keys['ArrowDown']) move.sub(forward);
    if (keys['KeyD'] || keys['ArrowRight']) move.add(right);
    if (keys['KeyA'] || keys['ArrowLeft']) move.sub(right);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * dt);
      camera.position.add(move);
    }

    // Clamp to room bounds
    camera.position.x = Math.max(-BOUND_X, Math.min(BOUND_X, camera.position.x));
    camera.position.z = Math.max(-BOUND_Z, Math.min(BOUND_Z, camera.position.z));
    camera.position.y = 1.7;

    // Apply camera rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    // Animate slot machine glow (pulsing)
    const time = clock.getElapsedTime();
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mat = obj.material as THREE.MeshStandardMaterial;
        if (mat.emissive && mat.emissiveIntensity > 1) {
          // Pulse glow
          mat.emissiveIntensity = 1.2 + Math.sin(time * 3 + obj.position.x) * 0.3;
        }
      }
    });

    renderer.render(scene, camera);
  }
  animate();

  // ===== CLEANUP =====
  return {
    dispose() {
      cancelAnimationFrame(animId);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onLockChange);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    },
  };
}
