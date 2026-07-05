import {
  AppOptions,
  Application,
  Color,
  Entity,
  Keyboard,
  Mouse,
  Vec3,
} from 'playcanvas';
import { FirstPersonController } from './FirstPersonController';
import { CasinoEnvironment } from './CasinoEnvironment';

export interface CasinoApp {
  app: Application;
  onInteractionAvailable: (prompt: string) => void;
  onInteractionEnd: () => void;
  destroy: () => void;
}

export async function initCasino(canvas: HTMLCanvasElement): Promise<CasinoApp> {
  const app = new Application(canvas);
  const options = new AppOptions();
  options.mouse = new Mouse(canvas);
  options.keyboard = new Keyboard(window);
  app.init(options);


  // Camera + controller
  const camera = new Entity('camera');
  camera.addComponent('camera', {
    clearColor: new Color(0.05, 0.02, 0.1, 1),
    fov: 75,
    nearClip: 0.1,
    farClip: 200,
  });
  app.root.addChild(camera);

  // Lighting
  const ambient = new Entity('ambient');
  ambient.addComponent('light', {
    type: 'omni',
    color: new Color(1, 0.9, 0.7),
    intensity: 0.3,
    range: 50,
  });
  ambient.setPosition(0, 8, 0);
  app.root.addChild(ambient);

  // Main ceiling lights
  for (let i = 0; i < 4; i++) {
    const light = new Entity(`light-${i}`);
    light.addComponent('light', {
      type: 'spot',
      color: new Color(1, 0.85, 0.5),
      intensity: 2,
      range: 30,
      outerConeAngle: 60,
      innerConeAngle: 30,
      castShadows: true,
    });
    light.setPosition(
      (i % 2 === 0 ? -1 : 1) * 8,
      10,
      i < 2 ? -5 : 5
    );
    light.setLocalEulerAngles(90, 0, 0);
    app.root.addChild(light);
  }

  // Build the casino environment
  const environment = new CasinoEnvironment(app);
  environment.build();

  // First-person controller
  const controller = new FirstPersonController(app, camera);
  controller.setPosition(0, 1.7, 10);
  controller.setupInteractions(environment.getInteractables());

  // Interaction callbacks
  const casinoApp: CasinoApp = {
    app,
    onInteractionAvailable: () => {},
    onInteractionEnd: () => {},
    destroy: () => {
      app.destroy();
    },
  };

  controller.onPromptChange = (prompt: string | null) => {
    if (prompt) casinoApp.onInteractionAvailable(prompt);
    else casinoApp.onInteractionEnd();
  };

  // Start the app
  app.start();

  // Auto resize handled by PlayCanvas fill mode
  app.setCanvasFillMode('FILL_WINDOW', window.innerWidth, window.innerHeight);
  window.addEventListener('resize', () => app.resizeCanvas());

  return casinoApp;
}
