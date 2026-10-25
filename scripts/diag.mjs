#!/usr/bin/env node
/**
 * Look-dev diagnostics (not a gate tool): renders one shot at 1920×1080 with
 * debug query flags, e.g. `node scripts/diag.mjs m2-hero out.png noao nomsaa`.
 */
import { launchBrowser, openShot, startServer } from './harness.mjs';
const [id, out, ...flags] = process.argv.slice(2);
const server = await startServer(false);
const { browser } = await launchBrowser('auto');
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
ctx.setDefaultTimeout(300000);
const page = await openShot(
  ctx,
  server.url,
  id,
  { w: 1920, h: 1080 },
  [],
  flags.map((f) => `&${f}=1`).join(''),
);
await page.screenshot({ path: out });
await browser.close();
await server.close();
