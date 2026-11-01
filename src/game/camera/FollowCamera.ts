import { PerspectiveCamera, Vector3 } from 'three';

/** Camera feel (PLAN M4: third-person auto camera with collision). */
export const CAM = {
  /**
   * Glazey (1 m) stands about a quarter of the frame tall: big enough to read
   * his face, far enough that his 1/32 m voxels stay near the art bible's
   * density limit (§3).
   */
  distance: 6.4,
  /** Elevation above the horizon (radians): low, so the sky shows up top (ref 02). */
  pitch: 0.13,
  /** Aim point above Glazey's soles (meters): he sits on the lower third. */
  aimHeight: 1.3,
  fov: 38,
  /** Manual orbit speed (rad/s at full input). */
  orbit: 2.4,
  /** Clearance kept from walls and terrain (meters). */
  clearance: 0.25,
  /**
   * Look-ahead framing (art bible §7 composition): how far across the screen
   * his facing must point (sine) for him to sit fully on a vertical third,
   * with the frame's room ahead of him, and how fast the framing eases there.
   */
  leadAcross: 0.4,
  leadRate: 2.2,
} as const;

const approach = (cur: number, target: number, rate: number, dt: number): number =>
  cur + (target - cur) * (1 - Math.exp(-rate * dt));

/** Returns the free distance from `from` toward `dir` (unit), up to `max`. */
export type CameraProbe = (from: Vector3, dir: Vector3, max: number) => number;

/**
 * A kid-friendly third-person camera on a lazy leash: it keeps its bearing
 * from Glazey, so sideways walking slowly orbits it around and walking toward
 * the lens backs it up instead of whipping it round. It rides the ground
 * height (hops lift the aim only part way, so jumps don't seasick the view)
 * and pulls in before a wall or hill gets between it and Glazey.
 */
export class FollowCamera {
  readonly camera: PerspectiveCamera;
  /** Azimuth of the camera around Glazey: the camera sits at +sin/+cos(yaw). */
  yaw = 0;
  private readonly aim = new Vector3();
  /** Where the camera would be without collision (the leash end). */
  private readonly leash = new Vector3();
  private groundY = 0;
  private dist: number = CAM.distance;
  /** Framing pan, −1…1 thirds (+ = the look point slides to screen right). */
  private frame = 0;
  private readonly probe: CameraProbe;
  private readonly floor: (x: number, z: number) => number;

  constructor(
    aspect: number,
    probe: CameraProbe,
    floor: (x: number, z: number) => number,
    fov: number = CAM.fov,
  ) {
    this.camera = new PerspectiveCamera(fov, aspect, 0.05, 900);
    this.probe = probe;
    this.floor = floor;
  }

  /** Snaps behind `target` with the given azimuth (no easing). */
  reset(target: Vector3, yaw: number): void {
    this.yaw = yaw;
    this.aim.copy(target);
    this.groundY = target.y;
    this.dist = CAM.distance;
    this.frame = 0;
    this.place();
  }

  update(dt: number, target: Vector3, grounded: boolean, look: number, facing?: number): void {
    // Lead the frame the way he faces: the more his facing points across the
    // screen, the further he sits toward the opposite third (look room ahead).
    if (dt > 0 && facing !== undefined) {
      const across = Math.sin(facing - this.yaw);
      const want = Math.max(-1, Math.min(1, across / CAM.leadAcross));
      this.frame = approach(this.frame, want, CAM.leadRate, dt);
    }
    // Ride the ground height; in the air, follow most of the rise, so he stays
    // framed against the lawn with the ground (and his shadow) below him.
    if (grounded) this.groundY = approach(this.groundY, target.y, 6, dt);
    const lift = grounded ? 0 : Math.max(0, target.y - this.groundY) * 0.45;
    const ax = approach(this.aim.x, target.x, 10, dt);
    const az = approach(this.aim.z, target.z, 10, dt);
    this.aim.set(ax, approach(this.aim.y, this.groundY + lift, 8, dt), az);
    // The leash: keep the bearing from the (smoothed) aim to where the camera
    // last was, then add any manual orbit. Measured from the same point the
    // leash hangs from, or the lag would feed back into a spiral.
    const bx = this.leash.x - this.aim.x;
    const bz = this.leash.z - this.aim.z;
    if (Math.hypot(bx, bz) > 0.5) this.yaw = Math.atan2(bx, bz);
    if (Math.abs(look) > 0.05) this.yaw += look * CAM.orbit * dt;
    this.place(dt);
  }

  private place(dt = 0): void {
    const aim = new Vector3(this.aim.x, this.aim.y + CAM.aimHeight, this.aim.z);
    const dir = new Vector3(
      Math.sin(this.yaw) * Math.cos(CAM.pitch),
      Math.sin(CAM.pitch),
      Math.cos(this.yaw) * Math.cos(CAM.pitch),
    );
    this.leash.copy(aim).addScaledVector(dir, CAM.distance);
    const free = this.probe(aim, dir, CAM.distance + CAM.clearance) - CAM.clearance;
    const want = Math.max(0.8, Math.min(CAM.distance, free));
    // Pull in at once, ease back out.
    this.dist = want < this.dist || dt === 0 ? want : approach(this.dist, want, 2.5, dt);
    const eye = aim.clone().addScaledVector(dir, this.dist);
    eye.y = Math.max(eye.y, this.floor(eye.x, eye.z) + CAM.clearance);
    this.camera.position.copy(eye);
    // Pan the look point toward a third: a third of the half-width at his distance.
    const halfW = this.dist * Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.aspect;
    const pan = (this.frame * halfW) / 3;
    this.camera.lookAt(aim.x + Math.cos(this.yaw) * pan, aim.y, aim.z - Math.sin(this.yaw) * pan);
  }

  /** Turns a screen-space stick into a world direction on the ground. */
  toWorld(moveX: number, moveY: number): { x: number; z: number } {
    // Forward is away from the camera: -(sin yaw, cos yaw); right is its perpendicular.
    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    return { x: fx * moveY - fz * moveX, z: fz * moveY + fx * moveX };
  }
}
