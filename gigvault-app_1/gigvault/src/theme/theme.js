// GigVault — "Dash Cluster" theme
// Instrument-cluster inspired dark theme for gig drivers.

export const colors = {
  bgDeep: '#020203',
  bgBase: '#050506',
  bgElevated: '#0a0a0c',
  border: 'rgba(255,255,255,0.07)',
  trackBg: 'rgba(255,255,255,0.07)',

  accent: '#5E6AD2',       // indigo — primary gauge / active states
  accentGlow: 'rgba(94,106,210,0.18)',
  success: '#34D399',      // income / online status
  warning: '#F59E0B',      // tax set-aside
  danger: '#E24B4A',       // expenses

  textPrimary: '#EDEDEF',
  textSecondary: '#C8C9CE',
  textMuted: '#8A8F98',
  roadLine: '#33333a',
  roadBg: '#16161a',
};

export const fonts = {
  display: 'Sora_600SemiBold',
  label: 'Sora_500Medium',
  body: 'Sora_400Regular',
  numericBold: 'IBMPlexMono_500Medium',
  numeric: 'IBMPlexMono_400Regular',
};

export const radius = {
  card: 16,
  pill: 18,
  chip: 9,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export default { colors, fonts, radius, spacing };
