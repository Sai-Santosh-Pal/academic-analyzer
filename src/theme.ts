import { Platform } from 'react-native'

export const C = {
  primary: '#097FE8',
  primarySoft: '#E6F2FD',
  primaryDark: '#0075DE',
  accent: '#0075DE',
  accentSoft: '#E6F2FD',
  success: '#27918D',
  successSoft: '#E5F2F1',
  warning: '#FFB110',
  warningSoft: '#FFF5E0',
  danger: '#F64932',
  dangerSoft: '#FEF3F1',
  info: '#097FE8',
  infoSoft: '#E6F2FD',
  urgent: '#FF6D00',

  bg: '#FCF8F5',
  card: '#FFFFFF',
  border: 'rgba(0,0,0,0.08)',
  text: '#000000',
  text2: '#31302E',
  text3: '#78736F',
  white: '#FFFFFF',
  black: '#000000',

  ai: '#9849E8',
  aiSoft: '#F8F5FC',

  chart: ['#097FE8', '#9849E8', '#27918D', '#FF6D00', '#FFB110', '#0075DE', '#9C7054', '#F64932'],
}

export const S = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  radius: 14,
  radiusLg: 20,
  radiusXl: 28,
}

export const F = {
  title: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  h1: { fontSize: 21, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  h2: { fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: -0.2 },
  h3: { fontSize: 15, fontWeight: '700', color: C.text },
  body: { fontSize: 14.5, color: C.text },
  body2: { fontSize: 13.5, color: C.text2 },
  caption: { fontSize: 12, color: C.text3, fontWeight: '600' },
  micro: { fontSize: 10.5, color: C.text3, fontWeight: '700', letterSpacing: 0.6 },
  mono: {
    fontSize: 12,
    color: C.text2,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
} as const

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  float: {
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
}

export const TONE = {
  good: { color: C.success, soft: C.successSoft, label: 'Improved' },
  bad: { color: C.danger, soft: C.dangerSoft, label: 'Declined' },
  info: { color: C.primary, soft: C.primarySoft, label: 'Stable' },
  warn: { color: C.warning, soft: C.warningSoft, label: 'Attention' },
} as const

export type Tone = keyof typeof TONE

export function deltaTone(delta: number): Tone {
  if (delta > 2) return 'good'
  if (delta < -2) return 'bad'
  return 'info'
}

export function toneColor(t: Tone) {
  return TONE[t].color
}