import {
  Box3,
  Color,
  DirectionalLight,
  HemisphereLight,
  NeutralToneMapping,
  OrthographicCamera,
  SRGBColorSpace,
  Scene,
  Vector3,
  WebGLRenderer,
  type Object3D,
} from 'three';
import { LIGHT_PALETTE } from '../art/palette';
import { createVoxelMaterial } from '../engine/render/Materials';
import { MesherPool } from '../engine/voxel/MesherPool';
import { placeModel } from '../engine/voxel/placeModel';
import type { VoxelGrid } from '../engine/voxel/VoxelGrid';

export interface IconSpec {
  grid: VoxelGrid;
  voxel: number;
  /** Model size in voxels (the model is centered on it). */
  size: readonly [number, number, number];
  /** Where the camera looks from (a direction, any length). */
  view: Vector3;
  /** Output size in CSS pixels (rendered at 2× for sharp edges). */
  px: number;
}

/** Renders one voxel model to a transparent PNG (see `renderIcon`). */
export async function renderVoxelIcon(spec: IconSpec): Promise<string> {
  const pool = new MesherPool();
  const { group, ready } = placeModel(
    {
      grid: spec.grid,
      voxel: spec.voxel,
      pivot: [spec.size[0] / 2, spec.size[1] / 2, spec.size[2] / 2],
      pos: new Vector3(),
      rotY: 0,
      shadow: false,
    },
    createVoxelMaterial(),
    pool,
  );
  await ready;
  pool.dispose();
  return renderIcon(group, spec.view, spec.px);
}

/**
 * Renders a meshed voxel object to a transparent PNG for the UI (art bible §9:
 * icons in the same voxel style, rendered from voxel models), lit like a studio
 * product shot: a warm key over the viewer's shoulder, cool fill and rim.
 */
export function renderIcon(object: Object3D, view: Vector3, cssPx: number): string {
  const canvas = document.createElement('canvas');
  const px = cssPx * 2;
  canvas.width = px;
  canvas.height = px;
  const gl = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  gl.setClearColor(0x000000, 0);
  // Neutral tone mapping keeps the palette's coral and the tuft's rainbow saturated.
  gl.toneMapping = NeutralToneMapping;
  gl.toneMappingExposure = 1.0;
  gl.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  scene.add(
    new HemisphereLight(
      new Color(LIGHT_PALETTE.studioFill),
      new Color(LIGHT_PALETTE.studioCloth),
      1.1,
    ),
  );
  const key = new DirectionalLight(new Color(LIGHT_PALETTE.studioKey), 3.6);
  key.position.copy(view.clone().normalize().multiplyScalar(3)).add(new Vector3(-1.4, 1.6, 0));
  const rim = new DirectionalLight(new Color(LIGHT_PALETTE.studioRim), 1.2);
  rim.position.set(2, 1, -1.5);
  scene.add(key, rim, object);

  object.updateMatrixWorld(true);
  const box = new Box3().setFromObject(object);
  const radius = box.getSize(new Vector3()).length() / 2;
  const center = box.getCenter(new Vector3());
  const cam = new OrthographicCamera(-radius, radius, radius, -radius, 0.01, radius * 8);
  cam.position.copy(center).addScaledVector(view.clone().normalize(), radius * 3);
  cam.lookAt(center);
  // Tighten the frame to the projected silhouette.
  cam.updateMatrixWorld();
  const corners: Vector3[] = [];
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) corners.push(new Vector3(x, y, z).project(cam));
  const ext = Math.max(...corners.map((c) => Math.max(Math.abs(c.x), Math.abs(c.y))));
  const half = radius * ext * 1.04;
  Object.assign(cam, { left: -half, right: half, top: half, bottom: -half });
  cam.updateProjectionMatrix();

  gl.render(scene, cam);
  const url = canvas.toDataURL('image/png');
  scene.remove(object);
  gl.dispose();
  gl.forceContextLoss();
  return url;
}
