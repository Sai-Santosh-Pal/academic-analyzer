import React from 'react'
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from 'react-native-svg'
import { ColorValue } from 'react-native'
import { C } from '../theme'

export type IconName = keyof typeof PATHS

const PATHS: Record<string, React.ReactNode> = {
  home: (<><Path d="M3 12l9-9 9 9" /><Path d="M5 10v10h5v-6h4v6h5V10" /></>),
  calendar: (<><Rect x="3" y="4" width="18" height="18" rx="2" /><Line x1="16" y1="2" x2="16" y2="6" /><Line x1="8" y1="2" x2="8" y2="6" /><Line x1="3" y1="10" x2="21" y2="10" /></>),
  trend: (<><Polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><Polyline points="16 7 22 7 22 13" /></>),
  sparkle: (<><Path d="M12 3l1.9 5.7 5.7 1.9-5.7 1.9L12 18.2l-1.9-5.7-5.7-1.9 5.7-1.9z" /><Path d="M19 15.5v4" /><Path d="M21 17.5h-4" /></>),
  user: (<><Circle cx="12" cy="8" r="4" /><Path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" /></>),
  users: (<><Circle cx="9" cy="8" r="4" /><Path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6" /><Path d="M16 4.5a4 4 0 0 1 0 7" /><Path d="M18.5 15.5c2 .8 3.5 2.6 3.5 5.5" /></>),
  bell: (<><Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>),
  book: (<><Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>),
  check: (<><Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><Polyline points="22 4 12 14.01 9 11.01" /></>),
  clock: (<><Circle cx="12" cy="12" r="10" /><Polyline points="12 6 12 12 16 14" /></>),
  up: (<><Line x1="12" y1="19" x2="12" y2="5" /><Polyline points="5 12 12 5 19 12" /></>),
  down: (<><Line x1="12" y1="5" x2="12" y2="19" /><Polyline points="19 12 12 19 5 12" /></>),
  plus: (<><Line x1="12" y1="5" x2="12" y2="19" /><Line x1="5" y1="12" x2="19" y2="12" /></>),
  chevron: (<><Polyline points="9 18 15 12 9 6" /></>),
  search: (<><Circle cx="11" cy="11" r="8" /><Line x1="21" y1="21" x2="16.65" y2="16.65" /></>),
  sliders: (<><Line x1="4" y1="21" x2="4" y2="14" /><Line x1="4" y1="10" x2="4" y2="3" /><Line x1="12" y1="21" x2="12" y2="12" /><Line x1="12" y1="8" x2="12" y2="3" /><Line x1="20" y1="21" x2="20" y2="16" /><Line x1="20" y1="12" x2="20" y2="3" /><Line x1="1" y1="14" x2="7" y2="14" /><Line x1="9" y1="8" x2="15" y2="8" /><Line x1="17" y1="16" x2="23" y2="16" /></>),
  file: (<><Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><Polyline points="14 2 14 8 20 8" /><Line x1="16" y1="13" x2="8" y2="13" /><Line x1="16" y1="17" x2="8" y2="17" /></>),
  target: (<><Circle cx="12" cy="12" r="10" /><Circle cx="12" cy="12" r="6" /><Circle cx="12" cy="12" r="2" /></>),
  alert: (<><Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><Line x1="12" y1="9" x2="12" y2="13" /><Line x1="12" y1="17" x2="12.01" y2="17" /></>),
  school: (<><Path d="M22 9L12 4 2 9" /><Path d="M5 9v10" /><Path d="M19 9v10" /><Path d="M3 19h18" /><Path d="M9 19v-6h6v6" /></>),
  edit: (<><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><Path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" /></>),
  trash: (<><Polyline points="3 6 5 6 21 6" /><Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>),
  x: (<><Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" /></>),
  download: (<><Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><Polyline points="7 10 12 15 17 10" /><Line x1="12" y1="15" x2="12" y2="3" /></>),
  share: (<><Circle cx="18" cy="5" r="3" /><Circle cx="6" cy="12" r="3" /><Circle cx="18" cy="19" r="3" /><Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>),
  print: (<><Polyline points="6 9 6 2 18 2 18 9" /><Path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><Rect x="6" y="14" width="12" height="8" /></>),
  back: (<><Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" /></>),
  send: (<><Line x1="22" y1="2" x2="11" y2="13" /><Polyline points="22 2 15 22 11 13 2 9 22 2" /></>),
  flag: (<><Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><Line x1="4" y1="22" x2="4" y2="15" /></>),
  clipboard: (<><Rect x="8" y="2" width="8" height="4" rx="1" /><Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></>),
  grid: (<><Rect x="3" y="3" width="7" height="7" rx="1" /><Rect x="14" y="3" width="7" height="7" rx="1" /><Rect x="14" y="14" width="7" height="7" rx="1" /><Rect x="3" y="14" width="7" height="7" rx="1" /></>),
  refresh: (<><Polyline points="23 4 23 10 17 10" /><Path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></>),
  eye: (<><Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><Circle cx="12" cy="12" r="3" /></>),
  bookOpen: (<><Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>),
  zap: (<><Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></>),
  message: (<><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>),
  heartPulse: (<><Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" /></>),
  award: (<><Circle cx="12" cy="8" r="6" /><Path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" /></>),
  list: (<><Line x1="8" y1="6" x2="21" y2="6" /><Line x1="8" y1="12" x2="21" y2="12" /><Line x1="8" y1="18" x2="21" y2="18" /><Line x1="3" y1="6" x2="3.01" y2="6" /><Line x1="3" y1="12" x2="3.01" y2="12" /><Line x1="3" y1="18" x2="3.01" y2="18" /></>),
  wallet: (<><Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><Path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><Path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></>),
  power: (<><Path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><Line x1="12" y1="2" x2="12" y2="12" /></>),
  settings: (<><Circle cx="12" cy="12" r="3" /><Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>),
  timeline: (<><Path d="M22 11V8a2 2 0 0 0-2-2h-6" /><Path d="M14 4l2-2 2 2-2 2z" /><Path d="M22 11v4a2 2 0 0 1-2 2h-6" /><Path d="M14 14l2-2 2 2-2 2z" /><Path d="M22 11v4a2 2 0 0 1-2 2H8" /><Path d="M2 17h6l2 2-2 2H2z" /></>),
}

export function Icon({ name, size = 20, color = C.text2, strokeWidth = 1.9 }: { name: IconName; size?: number; color?: ColorValue; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </Svg>
  )
}