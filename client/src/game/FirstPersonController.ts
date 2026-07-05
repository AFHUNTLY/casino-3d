import { Application, Entity, Vec3 } from 'playcanvas';

interface Interactable {
  entity: Entity;
  prompt: string;
  distance: number;
  onInteract: () => void;
}

export class FirstPersonController {
  private app: Application;
  private camera: Entity;
  private yaw = 0;
  private pitch = 0;
  private moveSpeed = 5;
  private mouseSensitivity = 0.002;
  private keys: Record<string, boolean> = {};
  private interactables: Interactable[] = [];
  private currentTarget: Interactable | null = null;

  onPromptChange: ((prompt: string | null) => void) | null = null;

  constructor(app: Application, camera: Entity) {
    this.app = app;
    this.camera = camera;

    this.setupInput();
    this.update = this.update.bind(this);
    app.on('update', this.update);
  }

  private setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse look (only when pointer locked)
    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement) {
        this.yaw -= e.movementX * this.mouseSensitivity;
        this.pitch -= e.movementY * this.mouseSensitivity;
        this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
      }
    });

    // Interaction (E key)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE' && this.currentTarget) {
        this.currentTarget.onInteract();
      }
    });
  }

  setPosition(x: number, y: number, z: number) {
    this.camera.setPosition(x, y, z);
  }

  setupInteractions(interactables: Interactable[]) {
    this.interactables = interactables;
  }

  private update(dt: number) {
    // Movement direction based on yaw
    const forward = new Vec3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new Vec3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const move = new Vec3(0, 0, 0);
    if (this.keys['KeyW']) move.add(forward);
    if (this.keys['KeyS']) move.sub(forward);
    if (this.keys['KeyD']) move.add(right);
    if (this.keys['KeyA']) move.sub(right);

    if (move.lengthSq() > 0) {
      move.normalize().mulScalar(this.moveSpeed * dt);
      this.camera.translate(move);
    }

    // Clamp position within casino walls
    const pos = this.camera.getPosition();
    const clampedX = Math.max(-19, Math.min(19, pos.x));
    const clampedZ = Math.max(-19, Math.min(19, pos.z));
    if (pos.x !== clampedX || pos.z !== clampedZ) {
      this.camera.setPosition(clampedX, pos.y, clampedZ);
    }

    // Apply rotation
    this.camera.setLocalEulerAngles(
      (this.pitch * 180) / Math.PI,
      (this.yaw * 180) / Math.PI,
      0
    );

    // Check for nearby interactables
    const playerPos = this.camera.getPosition();
    let nearest: Interactable | null = null;
    let nearestDist = Infinity;

    for (const item of this.interactables) {
      const dist = item.entity.getPosition().distance(playerPos);
      if (dist < item.distance && dist < nearestDist) {
        nearest = item;
        nearestDist = dist;
      }
    }

    if (nearest !== this.currentTarget) {
      this.currentTarget = nearest;
      if (this.onPromptChange) {
        this.onPromptChange(nearest ? nearest.prompt : null);
      }
    }
  }

  destroy() {
    this.app.off('update', this.update);
  }
}
