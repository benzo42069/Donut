import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  SMAAEffect,
  SMAAPreset,
  ToneMappingEffect,
  ToneMappingMode,
  type Effect,
} from 'postprocessing';
import { N8AOPostPass } from 'n8ao';
import {
  HalfFloatType,
  NoToneMapping,
  SRGBColorSpace,
  VSMShadowMap,
  WebGLRenderer,
  type Camera,
  type Scene,
} from 'three';
import type { QualitySettings } from '../quality';
import { ColorGradeEffect } from './ColorGrade';

export interface RendererInfo {
  readonly gpu: string;
  readonly webgl2: boolean;
}

/**
 * three.js renderer plus the post stack (art bible §6):
 * render → N8AO (screen-space AO) → bloom → AgX tone map → color grade → SMAA.
 */
export class Renderer {
  readonly gl: WebGLRenderer;
  readonly quality: QualitySettings;
  private composer: EffectComposer | null = null;
  private aoPass: N8AOPostPass | null = null;
  private width = 1;
  private height = 1;

  constructor(canvas: HTMLCanvasElement, quality: QualitySettings) {
    this.quality = quality;
    this.gl = new WebGLRenderer({
      canvas,
      antialias: false,
      stencil: false,
      depth: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.gl.outputColorSpace = SRGBColorSpace;
    this.gl.toneMapping = NoToneMapping;
    this.gl.shadowMap.enabled = true;
    this.gl.shadowMap.type = VSMShadowMap;
    this.gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.maxPixelRatio));
  }

  /** The screen-space AO pass, if this tier has one (for look-dev tuning). */
  get ao(): N8AOPostPass | null {
    return this.aoPass;
  }

  info(): RendererInfo {
    const ctx = this.gl.getContext();
    const ext = ctx.getExtension('WEBGL_debug_renderer_info');
    const gpu = ext ? String(ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'unknown';
    return { gpu, webgl2: this.gl.capabilities.isWebGL2 };
  }

  /** Builds the post chain for a scene/camera pair. Call again when either changes. */
  setScene(scene: Scene, camera: Camera): void {
    this.composer?.dispose();
    const q = this.quality;
    const composer = new EffectComposer(this.gl, {
      frameBufferType: HalfFloatType,
      multisampling: q.msaa,
    });
    composer.addPass(new RenderPass(scene, camera));

    if (q.ssao) {
      const ao = new N8AOPostPass(scene, camera, this.width, this.height);
      ao.configuration.aoRadius = 0.6;
      ao.configuration.distanceFalloff = 0.6;
      ao.configuration.intensity = 2.2;
      ao.configuration.aoSamples = q.aoSamples;
      ao.configuration.denoiseSamples = 8;
      ao.configuration.denoiseRadius = 10;
      ao.configuration.halfRes = q.tier !== 'high';
      ao.configuration.gammaCorrection = false;
      composer.addPass(ao);
      this.aoPass = ao;
    } else {
      this.aoPass = null;
    }

    const effects: Effect[] = [];
    if (q.bloom) {
      effects.push(
        new BloomEffect({
          luminanceThreshold: 0.85,
          luminanceSmoothing: 0.15,
          intensity: 0.45,
          mipmapBlur: true,
        }),
      );
    }
    effects.push(new ToneMappingEffect({ mode: ToneMappingMode.AGX }));
    effects.push(new ColorGradeEffect());
    if (q.smaa) effects.push(new SMAAEffect({ preset: SMAAPreset.HIGH }));
    composer.addPass(new EffectPass(camera, ...effects));

    composer.setSize(this.width, this.height);
    this.composer = composer;
  }

  setSize(width: number, height: number): void {
    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));
    this.gl.setSize(this.width, this.height, false);
    this.composer?.setSize(this.width, this.height);
  }

  render(deltaSeconds: number): void {
    this.composer?.render(deltaSeconds);
  }

  /** Blocks until the GPU has finished all queued work (a 1-pixel readback). */
  finish(): void {
    const ctx = this.gl.getContext();
    ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, new Uint8Array(4));
  }

  dispose(): void {
    this.composer?.dispose();
    this.gl.dispose();
  }
}
