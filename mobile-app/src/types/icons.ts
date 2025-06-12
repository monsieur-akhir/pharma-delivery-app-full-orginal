// Material Icons type workaround
export type MaterialIconName = string;

// Type guard pour vérifier si une icône est valide
export const isValidMaterialIcon = (icon: string): icon is MaterialIconName => {
  const validIcons = [
    'home', 'search', 'favorite', 'settings', 'person', 'shopping-cart',
    'notifications', 'location-on', 'phone', 'email', 'edit', 'delete',
    'add', 'check', 'close', 'arrow-back', 'arrow-forward', 'more-vert',
    'menu', 'refresh', 'share', 'schedule', 'local-pharmacy', 'delivery-dining',
    'access-time', 'account-circle', 'done', 'visibility', 'visibility-off',
    'star', 'star-border', 'thumb-up', 'thumb-down', 'send', 'call',
    'chat', 'shopping-bag', 'payment', 'history', 'help', 'info'
  ];
  return validIcons.includes(icon);
};

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