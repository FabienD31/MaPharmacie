/**
 * Palette et espacements partagés par toute l'application.
 * Centralisé ici pour éviter les couleurs codées en dur dans les écrans.
 */

export const couleurs = {
  fond: '#F5F7FA',
  carte: '#FFFFFF',
  bordure: '#E2E8F0',
  texte: '#1A202C',
  texteSecondaire: '#5A6B7F',
  primaire: '#1B6B9A',
  primaireClair: '#E6F2F9',
  // États de péremption
  perime: '#C0392B',
  bientotPerime: '#D98324',
  valide: '#2F7D52',
  avertissementFond: '#FFF8E6',
  avertissementBordure: '#F0D9A0',
} as const;

export const espacements = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
} as const;

export const rayons = {
  s: 6,
  m: 10,
  l: 14,
} as const;
