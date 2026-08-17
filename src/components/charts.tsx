import React from 'react'
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import Svg, { Path, Rect, Circle, Line, G, Text as SvgText } from 'react-native-svg'
import { C, F, S } from '../theme'

// ---------- Line chart ----------

export function LineChart({
  data, labels, color = C.primary, height = 140, width, showDots = true, fill = true, yMin, yMax, strokeWidth = 2.5,
}: {
  data: number[]
  labels?: string[]
  color?: string
  height?: number
  width?: number
  showDots?: boolean
  fill?: boolean
  yMin?: number
  yMax?: number
  strokeWidth?: number
}) {
  const w = width ?? 320
  const padX = 10
  const padY = 14
  if (!data.length) {
    return (
      <View style={{ width: w, height, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[F.caption, { color: C.text3 }]}>No data yet</Text>
      </View>
    )
  }
  const min = yMin ?? Math.floor((Math.min(...data) - 6) / 10) * 10
  const max = yMax ?? Math.ceil((Math.max(...data) + 6) / 10) * 10
  const span = max - min || 1
  const innerW = w - padX * 2
  const innerH = height - padY * 2
  const n = data.length
  const pts = data.map((v, i) => {
    const x = n === 1 ? padX + innerW / 2 : padX + (i / (n - 1)) * innerW
    const y = padY + innerH - ((v - min) / span) * innerH
    return { x, y, v }
  })
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${padY + innerH} L${pts[0].x.toFixed(1)},${padY + innerH} Z`
  const grid = [0.25, 0.5, 0.75].map((f) => padY + innerH - f * innerH)

  return (
    <View>
      <Svg width={w} height={height}>
        {grid.map((gy, i) => (
          <Line key={i} x1={padX} y1={gy} x2={w - padX} y2={gy} stroke={C.border} strokeWidth={1} strokeDasharray="4 4" />
        ))}
        <Line x1={padX} y1={padY + innerH} x2={w - padX} y2={padY + innerH} stroke={C.border} strokeWidth={1} />
        {fill && n > 1 ? <Path d={area} fill={color} opacity={0.1} /> : null}
        <Path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        {showDots && pts.map((p, i) => (
          <G key={i}>
            <Circle cx={p.x} cy={p.y} r={5.5} fill={color} opacity={0.18} />
            <Circle cx={p.x} cy={p.y} r={3.2} fill={color} />
          </G>
        ))}
      </Svg>
      {labels && labels.length > 1 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: padX, marginTop: 4 }}>
          {labels.map((l, i) => (
            <Text key={i} style={[F.micro, { fontSize: 9 }]} numberOfLines={1}>{l}</Text>
          ))}
        </View>
      ) : null}
    </View>
  )
}

// ---------- Bar chart ----------

export function BarChart({
  data, height = 150, width, color = C.primary, horizontal, showValue = true, style,
}: {
  data: { label: string; value: number; color?: string; sub?: string }[]
  height?: number
  width?: number
  color?: string
  horizontal?: boolean
  showValue?: boolean
  style?: StyleProp<ViewStyle>
}) {
  if (horizontal) {
    const max = Math.max(...data.map((d) => d.value), 1)
    return (
      <View style={[{ gap: 10 }, style]}>
        {data.map((d, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={[F.caption, { width: 74 }]} numberOfLines={1}>{d.label}</Text>
            <View style={{ flex: 1, height: 24, backgroundColor: C.bg, borderRadius: 8, overflow: 'hidden' }}>
              <View style={{ width: `${Math.max(3, (d.value / max) * 100)}%`, height: '100%', borderRadius: 8, backgroundColor: d.color ?? color, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 6 }}>
                <Text style={{ color: d.value / max > 0.35 ? '#fff' : d.color ?? color, fontSize: 9.5, fontWeight: '800' }}>{Math.round(d.value)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    )
  }
  const w = width ?? 300
  const max = Math.max(...data.map((d) => d.value), 1)
  const gap = 14
  const bw = Math.min(38, (w - gap * data.length) / data.length)
  return (
    <View>
      <Svg width={w} height={height}>
        {[0.33, 0.66].map((f, i) => (
          <Line key={i} x1={0} y1={height - 18 - f * (height - 30)} x2={w} y2={height - 18 - f * (height - 30)} stroke={C.border} strokeWidth={1} strokeDasharray="4 4" />
        ))}
        {data.map((d, i) => {
          const h = Math.max(4, (d.value / max) * (height - 34))
          const x = gap / 2 + i * ((w - gap) / data.length)
          const y = height - 18 - h
          return (
            <G key={i}>
              <Rect x={x} y={y} width={bw} height={h} rx={6} fill={d.color ?? color} opacity={0.85} />
              {showValue ? <SvgText x={x + bw / 2} y={y - 5} fontSize={9} fontWeight="800" fill={d.color ?? color} textAnchor="middle">{Math.round(d.value)}</SvgText> : null}
              <SvgText x={x + bw / 2} y={height - 6} fontSize={8.5} fontWeight="700" fill={C.text3} textAnchor="middle">{d.label}</SvgText>
            </G>
          )
        })}
      </Svg>
    </View>
  )
}

// ---------- Donut ----------

export function DonutChart({
  segments, size = 130, thickness = 20, centerLabel, centerValue, style,
}: {
  segments: { value: number; color: string; label?: string }[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string
  style?: StyleProp<ViewStyle>
}) {
  const total = Math.max(segments.reduce((a, s) => a + s.value, 0), 1)
  const r = (size - thickness) / 2
  const circ = 2 * Math.PI * r
  let acc = 0
  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.bg} strokeWidth={thickness} fill="none" />
          {segments.map((s, i) => {
            const frac = s.value / total
            const dash = `${frac * circ} ${circ}`
            const offset = -acc * circ
            acc += frac
            return (
              <Circle
                key={i} cx={size / 2} cy={size / 2} r={r} stroke={s.color} strokeWidth={thickness}
                fill="none" strokeDasharray={dash} strokeDashoffset={offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeLinecap="round"
              />
            )
          })}
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          {centerValue ? <Text style={{ fontSize: 21, fontWeight: '800', color: C.text, letterSpacing: -0.5 }}>{centerValue}</Text> : null}
          {centerLabel ? <Text style={[F.micro, { fontSize: 9 }]}>{centerLabel}</Text> : null}
        </View>
      </View>
    </View>
  )
}

export function Legend({ items }: { items: { label: string; color: string; value?: string }[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
      {items.map((it, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: it.color }} />
          <Text style={[F.caption, { fontSize: 11 }]}>{it.label}{it.value ? ` · ${it.value}` : ''}</Text>
        </View>
      ))}
    </View>
  )
}

// ---------- Heatmap (attendance style) ----------

export function Heatmap({
  columns, rows, values, rowLabels, colLabels, cellHeight = 22, style,
}: {
  columns: string[]
  rows: string[]
  values: number[][] // rows x columns, 0-100
  rowLabels: string[]
  colLabels: string[]
  cellHeight?: number
  style?: StyleProp<ViewStyle>
}) {
  const colorFor = (v: number) => {
    if (v >= 95) return '#27918D'
    if (v >= 85) return '#097FE8'
    if (v >= 75) return '#FFB110'
    if (v >= 60) return '#FF6D00'
    return '#F64932'
  }
  return (
    <View style={[{ flexDirection: 'row' }, style]}>
      <View style={{ marginRight: 6 }}>
        <View style={{ height: cellHeight, marginBottom: 4 }} />
        {rowLabels.map((l, i) => (
          <Text key={i} style={[F.micro, { fontSize: 8.5, height: cellHeight, lineHeight: cellHeight, textAlign: 'right', marginRight: 6 }]} numberOfLines={1}>{l}</Text>
        ))}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', marginBottom: 4 }}>
          {colLabels.map((l, i) => (
            <Text key={i} style={[F.micro, { fontSize: 8, flex: 1, textAlign: 'center' }]} numberOfLines={1}>{l}</Text>
          ))}
        </View>
        {values.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 3, marginBottom: 3 }}>
            {row.map((v, ci) => (
              <View key={ci} style={{ flex: 1, height: cellHeight, borderRadius: 5, backgroundColor: colorFor(v), alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 8, fontWeight: '800', opacity: v >= 60 ? 1 : 0.9 }}>{Math.round(v)}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  )
}

// ---------- Sparkline ----------

export function Sparkline({ data, color = C.primary, width = 64, height = 24, fill = true }: { data: number[]; color?: string; width?: number; height?: number; fill?: boolean }) {
  if (data.length < 2) return <View style={{ width, height }} />
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - 3 - ((v - min) / span) * (height - 6),
  }))
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  return (
    <Svg width={width} height={height}>
      {fill ? <Path d={area} fill={color} opacity={0.12} /> : null}
      <Path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={2.6} fill={color} />
    </Svg>
  )
}