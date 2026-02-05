export const theme = {
  bg: '#0a0a12',
  card: '#111122',
  border: '#1a1a2e',
  text: '#e8e8f0',
  textMuted: '#666',
  textDim: '#444',
  accent: '#00ff88',
  accentBlue: '#00ccff',
  pr: '#ffcc00',
  danger: '#ff4444',
};

export const SET_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  warmup: { bg: '#1a1a2e', text: '#666', label: 'W' },
  normal: { bg: 'transparent', text: '#e8e8f0', label: '' },
  dropset: { bg: '#332200', text: '#ff9900', label: 'D' },
  failure: { bg: '#331111', text: '#ff4444', label: 'F' },
};

export const MUSCLE_COLORS: Record<string, string> = {
  Chest: '#ff4444',
  Back: '#4488ff',
  Shoulders: '#ff8800',
  Biceps: '#aa44ff',
  Triceps: '#ff44aa',
  Quads: '#00cc66',
  Hamstrings: '#00aa88',
  Glutes: '#cc6600',
  Calves: '#668800',
  Abs: '#ffcc00',
  Forearms: '#888888',
};

export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Abs',
  'Forearms',
];

export const SET_TYPES = ['normal', 'warmup', 'dropset', 'failure'];

export const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];
