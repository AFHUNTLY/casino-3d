import { Application, Entity, Color, StandardMaterial, MeshInstance } from 'playcanvas';

interface Interactable {
  entity: Entity;
  prompt: string;
  distance: number;
  onInteract: () => void;
}

export class CasinoEnvironment {
  private app: Application;
  private interactables: Interactable[] = [];

  constructor(app: Application) {
    this.app = app;
  }

  build() {
    this.createFloor();
    this.createWalls();
    this.createCeiling();
    this.createDecorations();
    this.createSlotMachine();
    this.createBlackjackTable();
  }

  getInteractables(): Interactable[] {
    return this.interactables;
  }

  private createBox(
    name: string,
    pos: [number, number, number],
    scale: [number, number, number],
    color: [number, number, number],
    emissive: [number, number, number] = [0, 0, 0]
  ): Entity {
    const entity = new Entity(name);
    entity.addComponent('model', { type: 'box' });
    entity.setLocalPosition(pos[0], pos[1], pos[2]);
    entity.setLocalScale(scale[0], scale[1], scale[2]);

    const material = new StandardMaterial();
    material.diffuse = new Color(color[0], color[1], color[2]);
    material.emissive = new Color(emissive[0], emissive[1], emissive[2]);
    if (emissive[0] + emissive[1] + emissive[2] > 0) {
      material.emissiveIntensity = 0.5;
    }
    material.update();

    if (entity.model?.meshInstances) entity.model.meshInstances.forEach((mi: MeshInstance) => {
      mi.material = material;
    });

    this.app.root.addChild(entity);
    return entity;
  }

  private createFloor() {
    // Main casino floor — dark marble
    this.createBox('floor', [0, -0.1, 0], [40, 0.2, 40], [0.08, 0.05, 0.12]);

    // Carpet runner — red/gold
    const carpet = this.createBox('carpet', [0, 0.01, 0], [6, 0.02, 30], [0.3, 0.02, 0.04]);
    carpet.model?.meshInstances?.forEach((mi: MeshInstance) => {
      const mat = mi.material as StandardMaterial;
      mat.emissive = new Color(0.1, 0.01, 0.02);
      mat.emissiveIntensity = 0.3;
      mat.update();
    });
  }

  private createWalls() {
    const wallColor: [number, number, number] = [0.15, 0.1, 0.18];
    const wallHeight = 6;
    const roomSize = 20;

    this.createBox('wall-back', [0, wallHeight / 2, -roomSize], [roomSize * 2, wallHeight, 0.3], wallColor);
    this.createBox('wall-front', [0, wallHeight / 2, roomSize], [roomSize * 2, wallHeight, 0.3], wallColor);
    this.createBox('wall-left', [-roomSize, wallHeight / 2, 0], [0.3, wallHeight, roomSize * 2], wallColor);
    this.createBox('wall-right', [roomSize, wallHeight / 2, 0], [0.3, wallHeight, roomSize * 2], wallColor);
  }

  private createCeiling() {
    this.createBox('ceiling', [0, 6.5, 0], [40, 0.2, 40], [0.03, 0.02, 0.05]);

    // Chandelier-like light fixtures (emissive spheres)
    const positions: [number, number][] = [
      [-6, -6], [6, -6], [-6, 6], [6, 6], [0, 0]
    ];
    for (const [x, z] of positions) {
      const chandelier = new Entity(`chandelier-${x}-${z}`);
      chandelier.addComponent('model', { type: 'sphere' });
      chandelier.setLocalPosition(x, 5, z);
      chandelier.setLocalScale(0.5, 0.5, 0.5);

      const mat = new StandardMaterial();
      mat.emissive = new Color(1, 0.85, 0.4);
      mat.emissiveIntensity = 2;
      mat.diffuse = new Color(1, 0.85, 0.4);
      mat.update();
      chandelier.model?.meshInstances?.forEach((mi: MeshInstance) => {
        mi.material = mat;
      });
      this.app.root.addChild(chandelier);
    }
  }

  private createDecorations() {
    // Neon strips along the back wall
    const neonColors: [number, number, number][] = [
      [1, 0.1, 0.3], // Red neon
      [0.1, 0.5, 1], // Blue neon
      [1, 0.8, 0],   // Gold neon
    ];

    for (let i = 0; i < 6; i++) {
      const color = neonColors[i % neonColors.length];
      this.createBox(
        `neon-${i}`,
        [-18 + i * 7, 4, -19.7],
        [4, 0.1, 0.1],
        [0, 0, 0],
        color
      );
    }
  }

  private createSlotMachine() {
    const slotGroup = new Entity('slot-machine');
    slotGroup.setLocalPosition(-6, 0, -8);
    this.app.root.addChild(slotGroup);

    // Cabinet
    const cabinet = new Entity('slot-cabinet');
    cabinet.addComponent('model', { type: 'box' });
    cabinet.setLocalPosition(0, 1.5, 0);
    cabinet.setLocalScale(2, 3, 1.5);

    const cabinetMat = new StandardMaterial();
    cabinetMat.diffuse = new Color(0.4, 0.05, 0.1);
    cabinetMat.metalness = 0.6;
    cabinetMat.update();
    cabinet.model?.meshInstances?.forEach((mi: MeshInstance) => {
      mi.material = cabinetMat;
    });
    slotGroup.addChild(cabinet);

    // Screen (emissive)
    const screen = new Entity('slot-screen');
    screen.addComponent('model', { type: 'box' });
    screen.setLocalPosition(0, 2, 0.78);
    screen.setLocalScale(1.5, 1.5, 0.05);

    const screenMat = new StandardMaterial();
    screenMat.emissive = new Color(0.8, 0.1, 0.2);
    screenMat.emissiveIntensity = 1;
    screenMat.diffuse = new Color(0.1, 0, 0);
    screenMat.update();
    screen.model?.meshInstances?.forEach((mi: MeshInstance) => {
      mi.material = screenMat;
    });
    slotGroup.addChild(screen);

    // Top sign
    const sign = new Entity('slot-sign');
    sign.addComponent('model', { type: 'box' });
    sign.setLocalPosition(0, 3.2, 0);
    sign.setLocalScale(2, 0.4, 1.5);

    const signMat = new StandardMaterial();
    signMat.emissive = new Color(1, 0.84, 0);
    signMat.emissiveIntensity = 1.5;
    signMat.diffuse = new Color(0.3, 0.2, 0);
    signMat.update();
    sign.model?.meshInstances?.forEach((mi: MeshInstance) => {
      mi.material = signMat;
    });
    slotGroup.addChild(sign);

    this.interactables.push({
      entity: slotGroup,
      prompt: '[E] Play Slots',
      distance: 4,
      onInteract: () => {
        window.dispatchEvent(new CustomEvent('casino:interact', { detail: { game: 'slots' } }));
      },
    });
  }

  private createBlackjackTable() {
    const tableGroup = new Entity('blackjack-table');
    tableGroup.setLocalPosition(6, 0, -8);
    this.app.root.addChild(tableGroup);

    // Table top
    const tableTop = new Entity('bj-table-top');
    tableTop.addComponent('model', { type: 'cylinder' });
    tableTop.setLocalPosition(0, 1, 0);
    tableTop.setLocalScale(3, 0.15, 2);

    const feltMat = new StandardMaterial();
    feltMat.diffuse = new Color(0.05, 0.3, 0.1);
    feltMat.update();
    tableTop.model?.meshInstances?.forEach((mi: MeshInstance) => {
      mi.material = feltMat;
    });
    tableGroup.addChild(tableTop);

    // Table base
    const tableBase = new Entity('bj-table-base');
    tableBase.addComponent('model', { type: 'cylinder' });
    tableBase.setLocalPosition(0, 0.5, 0);
    tableBase.setLocalScale(0.3, 1, 0.3);

    const baseMat = new StandardMaterial();
    baseMat.diffuse = new Color(0.2, 0.1, 0.05);
    baseMat.update();
    tableBase.model?.meshInstances?.forEach((mi: MeshInstance) => {
      mi.material = baseMat;
    });
    tableGroup.addChild(tableBase);

    // Gold trim ring
    const trim = new Entity('bj-trim');
    trim.addComponent('model', { type: 'torus' });
    trim.setLocalPosition(0, 1.08, 0);
    trim.setLocalScale(3.1, 1, 2.1);
    trim.setLocalEulerAngles(90, 0, 0);

    const trimMat = new StandardMaterial();
    trimMat.diffuse = new Color(0.5, 0.4, 0.1);
    trimMat.metalness = 0.9;
    trimMat.emissive = new Color(0.2, 0.15, 0);
    trimMat.emissiveIntensity = 0.3;
    trimMat.update();
    trim.model?.meshInstances?.forEach((mi: MeshInstance) => {
      mi.material = trimMat;
    });
    tableGroup.addChild(trim);

    this.interactables.push({
      entity: tableGroup,
      prompt: '[E] Play Blackjack',
      distance: 4,
      onInteract: () => {
        window.dispatchEvent(new CustomEvent('casino:interact', { detail: { game: 'blackjack' } }));
      },
    });
  }
}
