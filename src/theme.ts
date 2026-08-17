import { Platform } from 'react-native'

export const C = {
  primary: '#0A84FF',
  primarySoft: '#EAF4FF',
  primaryDark: '#0066CC',
  accent: '#0A84FF',
  accentSoft: '#EAF4FF',
  success: '#1F9D5C',
  successSoft: '#E7F6EE',
  warning: '#E8930C',
  warningSoft: '#FDF3E3',
  danger: '#E5484D',
  dangerSoft: '#FDEDEE',
  info: '#0A84FF',
  infoSoft: '#EAF4FF',
  urgent: '#D93236',

  bg: '#EAF4FF',
  card: '#FFFFFF',
  border: 'rgba(10,102,204,0.14)',
  text: '#000000',
  text2: '#23324A',
  text3: '#5A6B85',
  white: '#FFFFFF',
  black: '#000000',

  ai: '#005BB5',
  aiSoft: '#EDF5FF',

  chart: ['#0A84FF', 'rgba(10,132,255,0.72)', 'rgba(10,132,255,0.52)', 'rgba(10,132,255,0.36)', 'rgba(10,132,255,0.24)', 'rgba(10,132,255,0.16)', 'rgba(10,132,255,0.1)', '#0066CC'],
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