// Material Icons type workaround
export type MaterialIconName = string;

// Common icon names that are valid
export const VALID_ICONS = {
  PHONE: 'phone' as const,
  MESSAGE: 'message' as const,
  LOCATION: 'location-on' as const,
  CAMERA: 'camera-alt' as const,
  CHECK: 'check' as const,
  CLOSE: 'close' as const,
  ARROW_BACK: 'arrow-back' as const,
  ARROW_FORWARD: 'arrow-forward' as const,
  MENU: 'menu' as const,
  MORE_VERT: 'more-vert' as const,
} as const;