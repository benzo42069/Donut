import { VOXEL_PALETTE } from '../art/palette';
import { idleFrame, type InputFrame, type InputSource } from '../engine/input/Input';

export interface TouchIcons {
  /** The jump button's icon: a voxel Glazey mid-hop. */
  jump: string;
  /** The stick knob: a little voxel donut. */
  knob: string;
  /** Munch: a bitten voxel donut. Burp: Glazey's giant-burp face. */
  munch: string;
  burp: string;
}

const hex = (name: keyof typeof VOXEL_PALETTE): string => VOXEL_PALETTE[name].hex;
const rgba = (name: keyof typeof VOXEL_PALETTE, a: number): string => {
  const h = hex(name);
  const n = parseInt(h.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

/**
 * Candy-like touch controls (art bible §9, game design §10): a floating stick
 * on the left half (a cream candy plate under the thumb; its knob is a voxel
 * donut) and three round candy buttons on the right, ringed in cream with a
 * soft drop shadow and a pressed state: a big green jump button (a voxel
 * Glazey mid-hop), a big pink munch button (a bitten donut) that pulses when a
 * donut is in reach, and a yellow burp button that grows with the belly.
 * Dragging anywhere else on the right orbits the camera.
 * No text anywhere: a 6-year-old who can't read can play.
 */
export class TouchControls implements InputSource {
  readonly root: HTMLDivElement;
  private readonly base: HTMLDivElement;
  private readonly knob: HTMLImageElement;
  private readonly jumpBtn: HTMLDivElement;
  private readonly munchBtn: HTMLDivElement;
  private readonly burpBtn: HTMLDivElement;
  private munchTap = false;
  private burpTap = false;
  private stickId: number | null = null;
  private lookId: number | null = null;
  private origin = { x: 0, y: 0 };
  private lookStart = 0;
  private stick = { x: 0, y: 0 };
  private look = 0;
  private jump = false;
  private jumpWas = false;

  constructor(parent: HTMLElement, icons: TouchIcons) {
    injectStyle();
    this.root = el('div', 'tc-root');
    const stick = el('div', 'tc-stick');
    this.base = el('div', 'tc-base');
    this.knob = document.createElement('img');
    this.knob.className = 'tc-knob';
    this.knob.src = icons.knob;
    this.knob.alt = '';
    stick.append(this.base, this.knob);
    const button = (cls: string, icon: string): HTMLDivElement => {
      const b = el('div', `tc-btn ${cls}`);
      const img = document.createElement('img');
      img.src = icon;
      img.alt = '';
      b.append(img);
      return b;
    };
    this.jumpBtn = button('tc-jump', icons.jump);
    this.munchBtn = button('tc-munch', icons.munch);
    this.burpBtn = button('tc-burp', icons.burp);
    this.root.append(stick, this.jumpBtn, this.munchBtn, this.burpBtn);
    parent.append(this.root);

    this.root.addEventListener('pointerdown', (e) => this.down(e));
    this.root.addEventListener('pointermove', (e) => this.move(e));
    this.root.addEventListener('pointerup', (e) => this.up(e));
    this.root.addEventListener('pointercancel', (e) => this.up(e));
    // Show the controls the first time the screen is touched.
    window.addEventListener(
      'pointerdown',
      (e) => {
        if (e.pointerType === 'touch') this.show(true);
      },
      { capture: true },
    );
    this.layout();
  }

  show(on: boolean): void {
    this.root.classList.toggle('tc-on', on);
  }

  /** The munch button pulses while a donut is in reach (game design §10). */
  setMunchReady(on: boolean): void {
    this.munchBtn.classList.toggle('tc-ready', on);
  }

  /** The burp button grows with the belly (0–5). */
  setBelly(belly: number): void {
    this.burpBtn.style.setProperty('--belly', String(belly / 5));
  }

  /** Displays a stick deflection (x right, y up) without a finger: the shot harness. */
  showStick(x: number, y: number): void {
    this.stick = { x, y };
    this.layout();
  }

  private radius(): number {
    return this.base.getBoundingClientRect().width * 0.36;
  }

  private layout(): void {
    // The knob travels 0.36 of the base: 69 % of its own width (52 % of the base).
    const k = 0.36 / 0.52;
    this.knob.style.transform = `translate(${(-0.5 + this.stick.x * k) * 100}%, ${(-0.5 - this.stick.y * k) * 100}%)`;
    this.root.classList.toggle(
      'tc-active',
      this.stickId !== null || Math.hypot(this.stick.x, this.stick.y) > 0,
    );
    this.jumpBtn.classList.toggle('tc-pressed', this.jump);
  }

  private down(e: PointerEvent): void {
    for (const [btn, tap] of [
      [this.munchBtn, 'munch'],
      [this.burpBtn, 'burp'],
    ] as const) {
      if (e.target instanceof Node && btn.contains(e.target)) {
        if (tap === 'munch') this.munchTap = true;
        else this.burpTap = true;
        btn.classList.add('tc-pressed');
        window.setTimeout(() => btn.classList.remove('tc-pressed'), 140);
        return;
      }
    }
    if (e.target instanceof Node && this.jumpBtn.contains(e.target)) {
      this.jump = true;
      this.jumpBtn.setPointerCapture(e.pointerId);
      this.layout();
      return;
    }
    if (e.clientX < window.innerWidth * 0.5 && this.stickId === null) {
      this.stickId = e.pointerId;
      this.root.setPointerCapture(e.pointerId);
      // The stick floats to where the thumb lands.
      const stick = this.base.parentElement;
      if (stick) {
        const rect = stick.getBoundingClientRect();
        this.origin = { x: e.clientX, y: e.clientY };
        stick.style.left = `${e.clientX - rect.width / 2}px`;
        stick.style.top = `${e.clientY - rect.height / 2}px`;
        stick.style.bottom = 'auto';
      }
      this.layout();
    } else if (this.lookId === null) {
      this.lookId = e.pointerId;
      this.lookStart = e.clientX;
      this.root.setPointerCapture(e.pointerId);
    }
  }

  private move(e: PointerEvent): void {
    if (e.pointerId === this.stickId) {
      const r = this.radius();
      let x = (e.clientX - this.origin.x) / r;
      let y = -(e.clientY - this.origin.y) / r;
      const m = Math.hypot(x, y);
      if (m > 1) {
        x /= m;
        y /= m;
      }
      this.stick = { x, y };
      this.layout();
    } else if (e.pointerId === this.lookId) {
      this.look = Math.max(-1, Math.min(1, (e.clientX - this.lookStart) / 90));
    }
  }

  private up(e: PointerEvent): void {
    if (e.pointerId === this.stickId) {
      this.stickId = null;
      this.stick = { x: 0, y: 0 };
      const stick = this.base.parentElement;
      if (stick) stick.removeAttribute('style');
    } else if (e.pointerId === this.lookId) {
      this.lookId = null;
      this.look = 0;
    } else {
      this.jump = false;
    }
    this.layout();
  }

  read(): InputFrame {
    const f = idleFrame();
    const m = Math.hypot(this.stick.x, this.stick.y);
    const k = m < 0.12 ? 0 : Math.min(1, (m - 0.12) / 0.88) / m;
    f.moveX = this.stick.x * k;
    f.moveY = this.stick.y * k;
    f.jump = this.jump;
    f.jumpPressed = this.jump && !this.jumpWas;
    f.look = this.look;
    f.munchPressed = this.munchTap;
    f.burpPressed = this.burpTap;
    this.munchTap = false;
    this.burpTap = false;
    this.jumpWas = this.jump;
    return f;
  }
}

function el(tag: 'div', cls: string): HTMLDivElement {
  const d = document.createElement(tag);
  d.className = cls;
  return d;
}

let styled = false;

function injectStyle(): void {
  if (styled) return;
  styled = true;
  const s = document.createElement('style');
  // Every color is a palette color (art bible §4).
  const cream = (a: number): string => rgba('candyCream', a);
  s.textContent = `
.tc-root { position: fixed; inset: 0; pointer-events: none; display: none;
  touch-action: none; user-select: none; -webkit-user-select: none; z-index: 10; }
.tc-root.tc-on { display: block; pointer-events: auto; }
.tc-stick { position: absolute; left: max(28px, 5vw); bottom: max(22px, 6vh);
  width: min(36vh, 230px); height: min(36vh, 230px); }
.tc-base { position: absolute; inset: 0; border-radius: 50%;
  background: radial-gradient(circle at 50% 38%, ${hex('candyCream')} 0%, ${hex('butter')} 78%, ${hex('doughGolden')} 100%);
  border: min(1.6vh, 10px) solid ${hex('frostingPink')};
  box-shadow: 0 min(1.2vh, 7px) 0 ${hex('frostingPinkShadow')},
    0 min(2.4vh, 15px) min(2vh, 12px) ${rgba('chocolateDark', 0.45)},
    inset 0 min(1.4vh, 9px) min(2.4vh, 15px) ${rgba('doughGolden', 0.7)};
  opacity: 0.88; transition: opacity 0.15s; }
.tc-active .tc-base { opacity: 1; }
.tc-knob { position: absolute; left: 50%; top: 50%; width: 52%; height: 52%;
  filter: drop-shadow(0 min(1.2vh, 7px) min(1.2vh, 6px) ${rgba('chocolateDark', 0.35)});
  opacity: 0.92; transition: opacity 0.15s; pointer-events: none; }
.tc-active .tc-knob { opacity: 1; }
.tc-btn { position: absolute; border-radius: 50%;
  background: radial-gradient(circle at 36% 30%, var(--lit) 0%, var(--mid) 52%, var(--dark) 100%);
  border: min(1.6vh, 10px) solid ${hex('candyCream')};
  box-shadow: 0 min(1.4vh, 9px) 0 ${hex('doughGolden')},
    0 min(2.6vh, 16px) min(2vh, 12px) ${rgba('chocolateDark', 0.45)},
    inset 0 max(-1vh, -6px) min(1.6vh, 10px) var(--dark);
  transition: transform 0.06s, box-shadow 0.06s; }
.tc-btn::before { content: ''; position: absolute; left: 17%; top: 9%; width: 42%; height: 24%;
  border-radius: 50%; background: ${cream(0.5)}; transform: rotate(-24deg); filter: blur(1px); }
.tc-btn img { position: absolute; left: 50%; top: 50%; width: 80%; height: 80%;
  transform: translate(-50%, -55%);
  filter: drop-shadow(0 min(0.8vh, 5px) min(0.6vh, 4px) var(--dark)); pointer-events: none; }
.tc-btn.tc-pressed { transform: translateY(min(1.1vh, 7px)) scale(0.97);
  box-shadow: 0 min(0.3vh, 2px) 0 ${hex('doughGolden')},
    0 min(1vh, 6px) min(2vh, 12px) ${rgba('chocolateDark', 0.3)},
    inset 0 max(-1vh, -6px) min(1.6vh, 10px) var(--dark); }
/* Jump: the big green button. */
.tc-jump { right: max(30px, 5.5vw); bottom: max(26px, 7vh);
  width: min(28vh, 176px); height: min(28vh, 176px);
  --lit: ${hex('leafMint')}; --mid: ${hex('leafGreen')}; --dark: ${hex('leafDeep')}; }
.tc-jump img { transform: translate(-50%, -60%); }
/* Munch: the big pink button, left of jump; it pulses when a donut is in reach. */
.tc-munch { right: calc(max(30px, 5.5vw) + min(30vh, 190px)); bottom: max(20px, 5vh);
  width: min(23vh, 146px); height: min(23vh, 146px);
  --lit: ${hex('frostingPinkLight')}; --mid: ${hex('frostingPink')}; --dark: ${hex('frostingPinkShadow')}; }
.tc-munch.tc-ready { animation: tc-pulse 0.9s ease-in-out infinite; }
@keyframes tc-pulse { 50% { transform: scale(1.09); } }
/* Burp: yellow, above jump; it swells with the belly. */
.tc-burp { right: calc(max(30px, 5.5vw) + min(5vh, 30px)); bottom: calc(max(26px, 7vh) + min(31vh, 196px));
  width: min(17vh, 108px); height: min(17vh, 108px);
  transform: scale(calc(0.85 + 0.35 * var(--belly, 0))); transform-origin: 50% 100%;
  --lit: ${hex('butter')}; --mid: ${hex('sprinkleYellow')}; --dark: ${hex('doughGolden')}; }
.tc-burp.tc-pressed { transform: translateY(min(1.1vh, 7px)) scale(calc(0.82 + 0.35 * var(--belly, 0))); }
`;
  document.head.append(s);
}
