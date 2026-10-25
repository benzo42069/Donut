import { PerspectiveCamera, Timer } from 'three';
import { QUALITY, detectTier, isQualityTier, type QualityTier } from './engine/quality';
import { Renderer } from './engine/render/Renderer';
import { SHOTS } from './debug/shots';
import type { ShotScene } from './debug/shotTypes';

/** Screenshot-harness hooks (PLAN §2 "Determinism"). */
interface ShotApi {
  id: string;
  tier: QualityTier;
  gpu: string;
  /** Poses the frozen scene at time t, renders, and resolves once presented. */
  setTime(t: number): Promise<void>;
  stripTimes: readonly number[];
  /** Renders `frames` frames back to back and reports timing and GPU load. */
  perf(frames: number): Promise<PerfReport>;
}

interface PerfReport {
  frames: number;
  msPerFrame: number;
  fps: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
}

declare global {
  interface Window {
    __SHOT_READY__?: boolean;
    __SHOT_ERROR__?: string;
    __SHOT__?: ShotApi;
  }
}

const nextFrame = (): Promise<void> => new Promise((r) => requestAnimationFrame(() => r()));

function pickTier(params: URLSearchParams, forced?: QualityTier): QualityTier {
  const q = params.get('quality');
  if (isQualityTier(q)) return q;
  if (forced) return forced;
  if (params.has('shot')) return 'high';
  const nav = navigator as Navigator & { deviceMemory?: number };
  return detectTier({
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: nav.deviceMemory,
    maxTouchPoints: navigator.maxTouchPoints,
    screenWidth: window.screen.width,
  });
}

function fitCamera(shot: ShotScene, w: number, h: number): void {
  if (shot.camera instanceof PerspectiveCamera) {
    shot.camera.aspect = w / h;
    shot.camera.updateProjectionMatrix();
  }
}

async function boot(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const shotId = params.get('shot');
  const def = SHOTS[shotId ?? 'm0-test-cube'];
  if (!def) throw new Error(`Unknown shot "${shotId}". Known: ${Object.keys(SHOTS).join(', ')}`);

  const tier = pickTier(params, def.tier);
  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  const renderer = new Renderer(canvas, QUALITY[tier]);
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);

  const shot = await def.build(w / h);
  fitCamera(shot, w, h);
  renderer.setScene(shot.scene, shot.camera);
  await renderer.gl.compileAsync(shot.scene, shot.camera);

  if (shotId) {
    // Frozen clock: only setTime() advances the scene.
    const setTime = async (t: number): Promise<void> => {
      shot.update?.(t);
      // Two frames so lazily created targets settle, then wait for the GPU so
      // "ready" means the frame is really drawn (SwiftShader queues seconds of work).
      for (let i = 0; i < 2; i++) {
        renderer.render(1 / 60);
        renderer.finish();
        await nextFrame();
      }
    };
    await setTime(def.time ?? 0);
    window.__SHOT__ = {
      id: shotId,
      tier,
      gpu: renderer.info().gpu,
      setTime,
      stripTimes: shot.stripTimes ?? [0, 0.25, 0.5],
      async perf(frames: number): Promise<PerfReport> {
        const info = renderer.gl.info;
        info.autoReset = false;
        const t0 = performance.now();
        for (let i = 0; i < frames; i++) {
          info.reset();
          shot.update?.(i / 60);
          renderer.render(1 / 60);
          renderer.finish();
        }
        const ms = (performance.now() - t0) / frames;
        info.autoReset = true;
        return {
          frames,
          msPerFrame: ms,
          fps: 1000 / ms,
          drawCalls: info.render.calls,
          triangles: info.render.triangles,
          geometries: info.memory.geometries,
          textures: info.memory.textures,
        };
      },
    };
    window.__SHOT_READY__ = true;
    return;
  }

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    fitCamera(shot, window.innerWidth, window.innerHeight);
  });
  const timer = new Timer();
  timer.connect(document);
  const loop = (timestamp?: number): void => {
    timer.update(timestamp);
    const dt = Math.min(timer.getDelta(), 0.1);
    shot.update?.(timer.getElapsed());
    renderer.render(dt);
    requestAnimationFrame(loop);
  };
  loop();
}

boot().catch((err: unknown) => {
  window.__SHOT_ERROR__ = err instanceof Error ? (err.stack ?? err.message) : String(err);
  console.error(err);
});
