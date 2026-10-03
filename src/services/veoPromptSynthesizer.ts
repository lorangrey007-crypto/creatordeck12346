export type VeoStylePreset = 'cinematic' | 'documentary' | 'dark-mystery' | 'cyberpunk' | 'hyper-real';

export interface VeoPromptOptions {
  visualAction: string;
  spokenContext?: string;
  stylePreset?: VeoStylePreset;
  aspectRatio?: '16:9' | '9:16';
  cameraMotion?: string;
  lighting?: string;
  shotType?: string;
}

const STYLE_PRESET_MODIFIERS: Record<VeoStylePreset, {
  name: string;
  camera: string;
  lighting: string;
  colorGrade: string;
  keywords: string;
}> = {
  cinematic: {
    name: 'Cinematic 4K Master',
    camera: 'ARRI Alexa Mini LF, 35mm anamorphic prime lens, subtle 24fps cinematic motion blur, shallow depth of field f/1.8',
    lighting: 'Masterclass three-point cinematic lighting with soft key light, piercing rim highlights, subtle atmospheric haze',
    colorGrade: 'Kodak 5219 film stock color science, rich deep blacks, natural skin tones, refined highlight roll-off',
    keywords: 'photorealistic, 4k ultra-high definition, cinematic lighting, movie still, masterpiece, highly detailed',
  },
  documentary: {
    name: 'Gritty Investigative Doc',
    camera: 'High-end cinema camera, realistic handheld shoulder rig camera sway, natural focal length 50mm, authentic documentary texture',
    lighting: 'Available natural ambient light, practical tungsten lamps, authentic shadows, grounded realism',
    colorGrade: 'Neutral desaturated investigative film grade, muted tones, fine tactile film grain',
    keywords: 'real footage, investigative journalism, authentic texture, archival clarity, 4k broadcast quality',
  },
  'dark-mystery': {
    name: 'Dark Noir & Suspense',
    camera: 'Low-angle slow tracking shot, wide anamorphic lens, eerie perspective, deep cinematic shadows',
    lighting: 'Heavy chiaroscuro, volumetric beams of light cutting through thick mist, ominous silhouette rim lighting',
    colorGrade: 'Cold cyan-teal shadows contrasting with piercing amber light, brooding low-key atmosphere',
    keywords: 'psychological thriller, ominous mood, volumetric fog, dramatic chiaroscuro, 4k cinematic',
  },
  cyberpunk: {
    name: 'Neo-Tokyo Cyberpunk',
    camera: 'Smooth tracking dolly shot at knee level, anamorphic horizontal lens flare, 24fps cinema',
    lighting: 'Drenched neon tube reflections on rain-slicked asphalt, vibrant cyan and magenta backlights, steamy exhaust vents',
    colorGrade: 'High contrast electric neon palette, deep obsidian blacks, wet surface specular reflections',
    keywords: 'cyberpunk cinematic, neon glow, wet pavement reflections, volumetric steam, 4k sharp focus',
  },
  'hyper-real': {
    name: 'Hyper-Real Macro & Tactile',
    camera: 'Extreme macro probe lens, ultra-shallow depth of field f/1.4, slow microscopic push-in',
    lighting: 'Stark directional fiber-optic spotlight, dust motes floating in light beam, intricate surface texture',
    colorGrade: 'Ultra-crisp high dynamic range, micro-contrast enhancement, true-to-life color fidelity',
    keywords: '8k micro-detail, extreme close-up, tactile realism, hyper-detailed texture, award-winning cinematography',
  },
};

/**
 * Synthesizes a high-fidelity Google Veo 4K video generation prompt
 */
export function synthesizeVeoPrompt(options: VeoPromptOptions): string {
  const {
    visualAction,
    spokenContext = '',
    stylePreset = 'cinematic',
    aspectRatio = '16:9',
    cameraMotion,
    lighting,
    shotType,
  } = options;

  const preset = STYLE_PRESET_MODIFIERS[stylePreset] || STYLE_PRESET_MODIFIERS.cinematic;

  // Clean and enhance visual description
  let cleanedAction = visualAction.trim();
  if (cleanedAction.endsWith('.')) cleanedAction = cleanedAction.slice(0, -1);

  // Determine camera motion
  const chosenMotion = cameraMotion || (
    cleanedAction.toLowerCase().includes('push') ? 'Slow deliberate push-in dolly' :
    cleanedAction.toLowerCase().includes('aerial') || cleanedAction.toLowerCase().includes('drone') ? 'Smooth high-altitude aerial drone pan' :
    cleanedAction.toLowerCase().includes('walk') ? 'Steady forward tracking camera following subject' :
    'Cinematic slow tripod pan with subtle organic handheld motion'
  );

  // Determine shot framing
  const chosenFraming = shotType || (
    cleanedAction.toLowerCase().includes('close') || cleanedAction.toLowerCase().includes('detail') ? 'Cinematic close-up framing' :
    cleanedAction.toLowerCase().includes('wide') || cleanedAction.toLowerCase().includes('landscape') ? 'Expansive wide-angle establishing shot' :
    'Medium cinematic shot'
  );

  // Build the complete Veo prompt
  const parts = [
    `${chosenFraming}: ${cleanedAction}.`,
    `Camera Movement: ${chosenMotion}.`,
    `Optics & Rig: ${preset.camera}.`,
    `Lighting & Atmosphere: ${lighting || preset.lighting}.`,
    `Color & Texture: ${preset.colorGrade}.`,
    `Aesthetic Tags: ${preset.keywords}, photorealistic motion, seamless physics, --ar ${aspectRatio}.`,
  ];

  return parts.join(' ');
}

export const VEO_STYLE_PRESETS = STYLE_PRESET_MODIFIERS;
