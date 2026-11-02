#!/usr/bin/env node
/**
 * Screenshot harness (PLAN M0).
 *
 *   npm run shots -- --gate M0 [--iter 3] [--only id1,id2] [--renderer auto|gpu|swiftshader] [--dev]
 *
 * Builds the app, serves it, opens each `?shot=<id>` of the gate (scripts/gates.json)
 * at 1920×1080 and 844×390, waits for `window.__SHOT_READY__`, and saves PNGs to
 * shots/<gate>/<iter>/. Motion strips (3 frames) are saved as frames plus one
 * stitched PNG. A harness.json records the WebGL path, GPU string and timings.
 */
import { launchBrowser, openShot, parseArgs, startServer, ROOT } from './harness.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const VIEWPORTS = [
  { w: 1920, h: 1080 },
  { w: 844, h: 390 },
];
const SCREENSHOT_TIMEOUT_MS = 180_000;

/** Stitches strip frames side by side (half size) in a blank page's canvas. */
async function stitch(context, frames, outPath) {
  const page = await context.newPage();
  const dataUrls = frames.map((b) => `data:image/png;base64,${b.toString('base64')}`);
  const b64 = await page.evaluate(async (urls) => {
    const imgs = await Promise.all(
      urls.map(
        (u) =>
          new Promise((res, rej) => {
            const im = new Image();
            im.onload = () => res(im);
            im.onerror = rej;
            im.src = u;
          }),
      ),
    );
    const w = Math.round(imgs[0].width / 2);
    const h = Math.round(imgs[0].height / 2);
    const gap = 8;
    const c = document.createElement('canvas');
    c.width = w * imgs.length + gap * (imgs.length - 1);
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    imgs.forEach((im, i) => ctx.drawImage(im, i * (w + gap), 0, w, h));
    return c.toDataURL('image/png').split(',')[1];
  }, dataUrls);
  await writeFile(outPath, Buffer.from(b64, 'base64'));
  await page.close();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const gates = JSON.parse(await readFile(join(ROOT, 'scripts/gates.json'), 'utf8'));
  const gate = gates[args.gate];
  if (!gate) throw new Error(`Unknown gate ${args.gate}. Known: ${Object.keys(gates).join(', ')}`);
  const shots = args.only ? gate.shots.filter((s) => args.only.includes(s)) : gate.shots;
  const strips = (gate.strips ?? []).filter((s) => !args.only || args.only.includes(s));
  const outDir = join(ROOT, 'shots', args.gate, args.iter);
  await mkdir(outDir, { recursive: true });

  const t0 = Date.now();
  const server = await startServer(args.dev);
  const { browser, probe, path, flags } = await launchBrowser(args.renderer);
  console.log(`[shots] WebGL path: ${path} — ${probe.gpu}`);
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  context.setDefaultTimeout(SCREENSHOT_TIMEOUT_MS);
  const log = [];
  const files = [];
  const timings = {};
  let failed = false;

  try {
    for (const id of shots) {
      for (const vp of VIEWPORTS) {
        const t = Date.now();
        try {
          const page = await openShot(context, server.url, id, vp, log);
          const file = `${id}_${vp.w}x${vp.h}.png`;
          await page.screenshot({ path: join(outDir, file) });
          await page.close();
          files.push(file);
          timings[file] = Date.now() - t;
          console.log(`[shots] ${file} (${timings[file]} ms)`);
        } catch (e) {
          failed = true;
          log.push(`[${id} ${vp.w}x${vp.h}] ${e.message}`);
          console.error(`[shots] FAILED ${id} ${vp.w}x${vp.h}: ${e.message}`);
        }
      }
    }
    for (const id of strips) {
      const t = Date.now();
      try {
        const vp = VIEWPORTS[0];
        const page = await openShot(context, server.url, id, vp, log);
        const times = await page.evaluate(() => window.__SHOT__.stripTimes);
        const frames = [];
        for (const [i, time] of times.entries()) {
          const ts = Date.now();
          await page.evaluate((tt) => window.__SHOT__.setTime(tt), time);
          const file = `${id}_strip_f${i}.png`;
          console.log(`[shots]   strip frame ${i} posed in ${Date.now() - ts} ms`);
          frames.push(await page.screenshot({ path: join(outDir, file) }));
          files.push(file);
        }
        await page.close();
        const file = `${id}_strip.png`;
        await stitch(context, frames, join(outDir, file));
        files.push(file);
        timings[file] = Date.now() - t;
        console.log(`[shots] ${file} (${timings[file]} ms)`);
      } catch (e) {
        failed = true;
        log.push(`[${id} strip] ${e.message}`);
        console.error(`[shots] FAILED strip ${id}: ${e.message}`);
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }

  const report = {
    gate: args.gate,
    iter: args.iter,
    webglPath: path,
    gpu: probe.gpu,
    flags,
    files,
    timingsMs: timings,
    totalMs: Date.now() - t0,
    log,
    ok: !failed,
  };
  await writeFile(join(outDir, 'harness.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`[shots] ${files.length} files → ${outDir} (${report.totalMs} ms)`);
  if (log.length) console.log(log.join('\n'));
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
