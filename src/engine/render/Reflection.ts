import {
  HalfFloatType,
  Matrix4,
  PerspectiveCamera,
  Plane,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  type Camera,
  type Object3D,
  type Scene,
  type WebGLRenderer,
} from 'three';

/**
 * Planar reflection for a horizontal surface at height `y` (the milk lagoon,
 * RF-02). Renders the scene mirrored into a reduced-resolution target with an
 * oblique near plane (Lengyel), as three.js's Reflector does. Objects in
 * `hidden` (the surface itself, the sky dome) are skipped, and the target is
 * cleared to transparent, so alpha marks where something real is reflected;
 * everywhere else the surface keeps its environment-map reflection.
 */
export class PlanarReflection {
  readonly target: WebGLRenderTarget;
  /** Maps local surface positions to reflection-texture projective coords. */
  readonly textureMatrix = new Matrix4();
  private readonly camera = new PerspectiveCamera();
  private readonly y: number;
  private readonly scale: number;

  constructor(y: number, resolutionScale = 0.5) {
    this.y = y;
    this.scale = resolutionScale;
    this.target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 0 });
  }

  render(
    gl: WebGLRenderer,
    scene: Scene,
    camera: Camera,
    surface: Object3D,
    hidden: readonly Object3D[],
  ): void {
    if (!(camera instanceof PerspectiveCamera)) return;
    const size = gl.getDrawingBufferSize(new Vector2());
    const w = Math.max(1, Math.floor(size.x * this.scale));
    const h = Math.max(1, Math.floor(size.y * this.scale));
    if (this.target.width !== w || this.target.height !== h) this.target.setSize(w, h);

    const rc = this.camera;
    camera.updateMatrixWorld();
    // Mirror the camera about the plane y = this.y.
    const eye = new Vector3().setFromMatrixPosition(camera.matrixWorld);
    const dir = new Vector3(0, 0, -1).transformDirection(camera.matrixWorld);
    const up = new Vector3(0, 1, 0).transformDirection(camera.matrixWorld);
    rc.position.set(eye.x, 2 * this.y - eye.y, eye.z);
    rc.up.set(up.x, -up.y, up.z);
    rc.lookAt(rc.position.clone().add(new Vector3(dir.x, -dir.y, dir.z)));
    rc.far = camera.far;
    rc.updateMatrixWorld();
    rc.projectionMatrix.copy(camera.projectionMatrix);

    this.textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    this.textureMatrix.multiply(rc.projectionMatrix);
    this.textureMatrix.multiply(rc.matrixWorldInverse);
    this.textureMatrix.multiply(surface.matrixWorld);

    // Oblique near plane at the surface, so nothing below it is reflected.
    const plane = new Plane(new Vector3(0, 1, 0), -this.y).applyMatrix4(rc.matrixWorldInverse);
    const clip = new Vector4(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
    const pm = rc.projectionMatrix.elements;
    const q = new Vector4(
      (Math.sign(clip.x) + (pm[8] ?? 0)) / (pm[0] ?? 1),
      (Math.sign(clip.y) + (pm[9] ?? 0)) / (pm[5] ?? 1),
      -1,
      (1 + (pm[10] ?? 0)) / (pm[14] ?? 1),
    );
    clip.multiplyScalar(2 / clip.dot(q));
    pm[2] = clip.x;
    pm[6] = clip.y;
    pm[10] = clip.z + 1 - 0.003;
    pm[14] = clip.w;

    const vis = hidden.map((o) => o.visible);
    for (const o of hidden) o.visible = false;
    const prevTarget = gl.getRenderTarget();
    const prevAuto = gl.shadowMap.autoUpdate;
    const prevAlpha = gl.getClearAlpha();
    gl.shadowMap.autoUpdate = false;
    gl.setRenderTarget(this.target);
    gl.setClearAlpha(0);
    gl.clear();
    gl.render(scene, rc);
    gl.setClearAlpha(prevAlpha);
    gl.setRenderTarget(prevTarget);
    gl.shadowMap.autoUpdate = prevAuto;
    hidden.forEach((o, i) => (o.visible = vis[i] ?? true));
  }
}
