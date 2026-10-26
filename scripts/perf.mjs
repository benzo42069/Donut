#!/usr/bin/env node
/**
 * Perf probe (AGENTIC_LOOP §9).
 *
 *   npm run perf -- --gate M0 [--iter dev] [--frames 30] [--renderer auto|gpu|swiftshader]
 *
 * Renders each gate shot at 1920×1080 for N frames on its own tier and on `low`,
 * and logs ms/frame, fps, draw calls and triangles to shots/<gate>/<iter>/perf.json.
 * Under SwiftShader the absolute fps is meaningless; compare draw calls and
 * triangles across iterations instead, and real fps on a GPU machine.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { launchBrowser, openShot, parseArgs, startServer, ROOT } from './harness.mjs';

async function main() {
  const argv = process.argv.slice(2);
  const fi = argv.indexOf('--frames');
  const frames = fi >= 0 ? Number(argv.splice(fi, 2)[1]) : 30;
  const args = parseArgs(argv);
  const gates = JSON.parse(await readFile(join(ROOT, 'scripts/gates.json'), 'utf8'));
  const gate = gates[args.gate];
  if (!gate) throw new Error(`Unknown gate ${args.gate}`);
  const shots = args.only ? gate.shots.filter((s) => args.only.includes(s)) : gate.shots;

  const server = await startServer(args.dev);
  const { browser, probe, path } = await launchBrowser(args.renderer);
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  context.setDefaultTimeout(600_000);
  const log = [];
  const results = [];
  try {
    for (const id of shots) {
      for (const quality of [null, 'low']) {
        const q = quality ? `&quality=${quality}` : '';
        const page = await openShot(context, server.url, id, { w: 1920, h: 1080 }, log, q);
        const tier = await page.evaluate(() => window.__SHOT__.tier);
        const r = await page.evaluate((n) => window.__SHOT__.perf(n), frames);
        const bench = await page.evaluate(() => window.__SHOT__.bench());
        await page.close();
        results.push({ id, tier, ...r, ...(bench ? { bench } : {}) });
        if (bench) console.log(`[perf] ${id} ${tier} bench: ${JSON.stringify(bench)}`);
        console.log(
          `[perf] ${id} ${tier}: ${r.msPerFrame.toFixed(1)} ms (${r.fps.toFixed(1)} fps), ` +
            `${r.drawCalls} calls, ${r.triangles} tris`,
        );
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
  const outDir = join(ROOT, 'shots', args.gate, args.iter);
  await mkdir(outDir, { recursive: true });
  const report = { gate: args.gate, webglPath: path, gpu: probe.gpu, frames, results, log };
  await writeFile(join(outDir, 'perf.json'), JSON.stringify(report, null, 2) + '\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
