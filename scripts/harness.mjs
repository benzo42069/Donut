/** Shared Playwright/Vite plumbing for scripts/shots.mjs and scripts/perf.mjs. */
import { chromium } from 'playwright';
import { build, createServer, preview } from 'vite';
import { dirname, resolve } from 'node:path';
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const READY_TIMEOUT_MS = 240_000;
/** Expected, harmless driver chatter under SwiftShader. */
const LOG_NOISE = /KHR_parallel_shader_compile|GPU stall due to ReadPixels/;

const GPU_ARGS = [
  '--enable-gpu',
  '--ignore-gpu-blocklist',
  '--enable-webgl',
  '--use-angle=default',
];
const SWIFTSHADER_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

export function parseArgs(argv) {
  const args = { iter: 'dev', renderer: 'auto', dev: false, only: null, gate: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--gate') args.gate = next();
    else if (a === '--iter') args.iter = String(next());
    else if (a === '--only') args.only = next().split(',');
    else if (a === '--renderer') args.renderer = next();
    else if (a === '--dev') args.dev = true;
    else throw new Error(`Unknown argument: ${a}`);
  }
  if (!args.gate) throw new Error('Missing --gate <id> (see scripts/gates.json)');
  return args;
}

/** Launches Chromium and reports which WebGL2 renderer it actually got. */
export async function launchWith(flags) {
  const browser = await chromium.launch({ args: flags });
  const page = await browser.newPage();
  const probe = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return { webgl2: false, gpu: 'none' };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      webgl2: true,
      gpu: ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'unknown',
    };
  });
  await page.close();
  return { browser, probe };
}

/** GPU first; fall back to SwiftShader if there is no WebGL2 or only a software GPU. */
export async function launchBrowser(mode) {
  if (mode !== 'swiftshader') {
    const gpu = await launchWith(GPU_ARGS);
    const software = /swiftshader|llvmpipe|software/i.test(gpu.probe.gpu);
    if (gpu.probe.webgl2 && (!software || mode === 'gpu')) {
      return { ...gpu, path: software ? 'gpu-flags (software)' : 'gpu', flags: GPU_ARGS };
    }
    if (mode === 'gpu') throw new Error(`No WebGL2 with GPU flags (${gpu.probe.gpu})`);
    await gpu.browser.close();
    console.log(`[shots] GPU path unavailable (${gpu.probe.gpu}); falling back to SwiftShader`);
  }
  const sw = await launchWith(SWIFTSHADER_ARGS);
  if (!sw.probe.webgl2) throw new Error('No WebGL2 even with SwiftShader');
  return { ...sw, path: 'swiftshader', flags: SWIFTSHADER_ARGS };
}

export async function startServer(dev) {
  if (dev) {
    const server = await createServer({ root: ROOT, server: { port: 5199 }, logLevel: 'warn' });
    await server.listen();
    return { url: server.resolvedUrls.local[0], close: () => server.close() };
  }
  // A build directory per process, so two harness runs (e.g. the two reviewers
  // of a double gate) can work at the same time; preview picks a free port.
  const outDir = `node_modules/.shots-build/${process.pid}`;
  await build({ root: ROOT, logLevel: 'warn', build: { outDir, emptyOutDir: true } });
  const server = await preview({
    root: ROOT,
    build: { outDir },
    preview: { port: 4199, strictPort: false },
    logLevel: 'warn',
  });
  return {
    url: server.resolvedUrls.local[0],
    close: async () => {
      await server.close();
      await rm(resolve(ROOT, outDir), { recursive: true, force: true });
    },
  };
}

export async function openShot(context, url, id, vp, log, query = '') {
  const page = await context.newPage();
  await page.setViewportSize({ width: vp.w, height: vp.h });
  page.on('console', (m) => {
    if ((m.type() === 'error' || m.type() === 'warning') && !LOG_NOISE.test(m.text()))
      log.push(`[${id} ${m.type()}] ${m.text()}`);
  });
  page.on('pageerror', (e) => log.push(`[${id} pageerror] ${e.message}`));
  await page.goto(`${url}?shot=${encodeURIComponent(id)}${query}`);
  await page.waitForFunction(
    () => window.__SHOT_READY__ === true || !!window.__SHOT_ERROR__,
    null,
    {
      timeout: READY_TIMEOUT_MS,
    },
  );
  const error = await page.evaluate(() => window.__SHOT_ERROR__ ?? null);
  if (error) throw new Error(`shot ${id} failed: ${error}`);
  return page;
}
