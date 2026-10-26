/**
 * Player input (PLAN M4): keyboard, gamepad and touch merged into one frame.
 * Movement is a stick in screen terms (x right, y forward/up), magnitude 0–1;
 * the game turns it into a camera-relative direction.
 */
export interface InputFrame {
  moveX: number;
  moveY: number;
  /** Jump button held, and pressed on this frame. */
  jump: boolean;
  jumpPressed: boolean;
  /** Camera orbit input, -1..1 (right stick, touch drag). */
  look: number;
}

export interface InputSource {
  read(): InputFrame;
}

export const idleFrame = (): InputFrame => ({
  moveX: 0,
  moveY: 0,
  jump: false,
  jumpPressed: false,
  look: 0,
});

/** Clamps a stick to the unit disc with a radial dead zone. */
export function shapeStick(x: number, y: number, dead = 0.15): [number, number] {
  const m = Math.hypot(x, y);
  if (m < dead) return [0, 0];
  const k = Math.min(1, (m - dead) / (1 - dead)) / m;
  return [x * k, y * k];
}

const MOVE_KEYS: Record<string, [number, number]> = {
  KeyW: [0, 1],
  ArrowUp: [0, 1],
  KeyS: [0, -1],
  ArrowDown: [0, -1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};
const JUMP_KEYS = new Set(['Space', 'KeyJ', 'KeyK']);
const LOOK_KEYS: Record<string, number> = { KeyQ: -1, KeyE: 1 };

export class KeyboardInput implements InputSource {
  private readonly down = new Set<string>();
  private jumpWas = false;

  constructor(target: Window = window) {
    target.addEventListener('keydown', (e) => {
      if (e.code in MOVE_KEYS || JUMP_KEYS.has(e.code)) e.preventDefault();
      this.down.add(e.code);
    });
    target.addEventListener('keyup', (e) => this.down.delete(e.code));
    target.addEventListener('blur', () => this.down.clear());
  }

  read(): InputFrame {
    let x = 0;
    let y = 0;
    let look = 0;
    for (const code of this.down) {
      const m = MOVE_KEYS[code];
      if (m) {
        x += m[0];
        y += m[1];
      }
      look += LOOK_KEYS[code] ?? 0;
    }
    const l = Math.hypot(x, y) || 1;
    const jump = [...JUMP_KEYS].some((k) => this.down.has(k));
    const frame = {
      moveX: x / l,
      moveY: y / l,
      jump,
      jumpPressed: jump && !this.jumpWas,
      look: Math.max(-1, Math.min(1, look)),
    };
    this.jumpWas = jump;
    return frame;
  }
}

export class GamepadInput implements InputSource {
  private jumpWas = false;

  read(): InputFrame {
    const pads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
    const pad = [...pads].find((p) => p?.connected);
    if (!pad) return idleFrame();
    const [x, y] = shapeStick(pad.axes[0] ?? 0, -(pad.axes[1] ?? 0));
    const [look] = shapeStick(pad.axes[2] ?? 0, 0, 0.2);
    const jump = Boolean(pad.buttons[0]?.pressed || pad.buttons[1]?.pressed);
    const frame = { moveX: x, moveY: y, jump, jumpPressed: jump && !this.jumpWas, look };
    this.jumpWas = jump;
    return frame;
  }
}

/** Sums several sources: the strongest stick wins, buttons are OR-ed. */
export class MergedInput implements InputSource {
  private readonly sources: InputSource[];

  constructor(...sources: InputSource[]) {
    this.sources = sources;
  }

  read(): InputFrame {
    const out = idleFrame();
    let best = 0;
    for (const s of this.sources) {
      const f = s.read();
      const m = Math.hypot(f.moveX, f.moveY);
      if (m > best) {
        best = m;
        out.moveX = f.moveX;
        out.moveY = f.moveY;
      }
      out.jump ||= f.jump;
      out.jumpPressed ||= f.jumpPressed;
      if (Math.abs(f.look) > Math.abs(out.look)) out.look = f.look;
    }
    return out;
  }
}
