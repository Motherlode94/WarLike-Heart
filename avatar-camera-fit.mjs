/* Math-only helpers for fitting a 3D model in a perspective viewport.
 * No Three.js/browser dependencies; unit-tested to prevent head clipping.
 */
export function fitDistance(width,height,depth,aspect,fovDegrees=35){
 const safeAspect=Math.max(.1,Number.isFinite(aspect)?aspect:1);
 const fov=Math.min(120,Math.max(10,Number.isFinite(fovDegrees)?fovDegrees:35));
 const halfVertical=Math.tan(fov*Math.PI/360);
 const w=Math.max(0,Number(width)||0),h=Math.max(0,Number(height)||0),d=Math.max(0,Number(depth)||0);
 return Math.max(h/(2*halfVertical),w/(2*halfVertical*safeAspect))*1.2 + d*.8;
}
export function centerOffset(center,scale){
 return {x:-center.x*scale,y:-center.y*scale,z:-center.z*scale};
}
