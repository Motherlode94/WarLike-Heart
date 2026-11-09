/* Pure utilities for GLB inspection and approximate text-aligned speech poses.
 * SpeechSynthesis boundary events do not expose phoneme timings or audio samples.
 */
export const REQUIRED_BONES = {
  head: /(?:^|[_ .-])head(?:$|[_ .-])/i,
  neck: /(?:^|[_ .-])neck(?:$|[_ .-])/i,
  spine: /(?:^|[_ .-])(spine|chest|upperchest)(?:$|[_ .-])/i,
  hips: /(?:^|[_ .-])(hips|pelvis)(?:$|[_ .-])/i,
  leftArm: /(?:left[_ .-]?(upper)?arm|upperarm[_ .-]?l|mixamorigleftarm)/i,
  rightArm: /(?:right[_ .-]?(upper)?arm|upperarm[_ .-]?r|mixamorigrightarm)/i,
  leftLeg: /(?:left[_ .-]?(upper)?leg|left[_ .-]?(?:up|upper)leg|left[_ .-]?thigh|upperleg[_ .-]?l|mixamorigleftupleg)/i,
  rightLeg: /(?:right[_ .-]?(upper)?leg|right[_ .-]?(?:up|upper)leg|right[_ .-]?thigh|upperleg[_ .-]?r|mixamorigrightupleg)/i
};
export const VISEME_PATTERNS = {
  closed: /viseme[_ .-]?(pp|bmp)|mouthclose|mouth_press|^pp$/i,
  teeth: /viseme[_ .-]?(ff|fv)|mouthfunnel|^ff$/i,
  round: /viseme[_ .-]?(ou|oh|u)|mouthpucker|mouthround|^oh$/i,
  wide: /viseme[_ .-]?(aa|ah|a)|jawopen|mouthopen|^aa$/i,
  smile: /mouthsmile|smile|happy/i,
  blink: /eyeblink|blink/i,
  sad: /mouthfrown|sad/i
};
export function inspectAvatar({bones=[],shapes=[],animations=0,skinnedMeshes=0,meshes=0}={}) {
  const missingBones=Object.entries(REQUIRED_BONES)
    .filter(([,pattern])=>!bones.some(name=>pattern.test(name))).map(([name])=>name);
  const availableVisemes=Object.entries(VISEME_PATTERNS)
    .filter(([,pattern])=>shapes.some(name=>pattern.test(name))).map(([name])=>name);
  return {
    meshes,skinnedMeshes,animations,boneCount:bones.length,morphTargets:shapes.length,
    missingBones,availableVisemes,
    fullBodyRigCandidate:skinnedMeshes>0 && missingBones.length===0,
    speechReady:availableVisemes.includes("wide") && (availableVisemes.includes("closed") || availableVisemes.includes("round")),
    // Mesh/bone metadata does not prove visual likeness or animation fidelity.
    canonicalAppearanceValidated:false
  };
}
export function visemeForText(text,index) {
  if(typeof text!=="string"||!text.length)return "neutral";
  const i=Math.max(0,Math.min(Math.trunc(Number(index)||0),text.length-1));
  const part=text.slice(i).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const ch=part[0]||"";
  if(/[.!?,;:\s]/.test(ch))return "neutral";
  if(/^(ch|sh|j)/.test(part))return "teeth";
  if(/^[bmp]/.test(part))return "closed";
  if(/^[fv]/.test(part))return "teeth";
  if(/^(ou|au|eau|o|u)/.test(part))return "round";
  if(/^[aeiy]/.test(part))return "wide";
  return "wide";
}
