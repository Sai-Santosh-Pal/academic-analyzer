import React, { ReactNode } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal as RNModal,
  Pressable, ActivityIndicator, RefreshControl, Platform, StyleProp, ViewStyle, TextStyle, DimensionValue, Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { C, S, F, shadow } from '../theme'

// ---------- Layout ----------

export function Screen({
  children, scroll, refresh, onRefresh, style, bg, pad = true, contentContainerStyle,
}: {
  children: ReactNode
  scroll?: boolean
  refresh?: boolean
  onRefresh?: () => void
  style?: StyleProp<ViewStyle>
  bg?: string
  pad?: boolean
  contentContainerStyle?: StyleProp<ViewStyle>
}) {
  const bgColor = bg ?? C.bg
  if (scroll) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: bgColor }, style]} edges={['top']}>
        <ScrollView
          contentContainerStyle={[{ padding: pad ? S.lg : 0, paddingBottom: 120 }, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={refresh ? <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} /> : undefined}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    )
  }
  return <SafeAreaView style={[{ flex: 1, backgroundColor: bgColor, padding: pad ? S.lg : 0 }, style]} edges={['top']}>{children}</SafeAreaView>
}

export function Header({ title, subtitle, right, onBack }: { title: string; subtitle?: string; right?: ReactNode; onBack?: () => void }) {
  return (
    <View style={styles.headerRow}>
      <View style={{ flex: 1 }}>
        {onBack && <Text onPress={onBack} style={[F.caption, { color: C.primary, marginBottom: 2 }]}>‹ Back</Text>}
        <Text style={F.h1} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={[F.caption, { marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  )
}

// ---------- Card ----------

export function Card({ children, style, onPress, tone }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; tone?: { color: string; soft: string } }) {
  const base: StyleProp<ViewStyle> = [
    styles.card,
    tone ? { backgroundColor: tone.soft, borderColor: tone.color + '33' } : null,
    style,
  ]
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={base}>
        {children}
      </TouchableOpacity>
    )
  }
  return <View style={base}>{children}</View>
}

export function SectionHeader({ title, action, actionLabel, right, onAction }: { title: string; actionLabel?: string; onAction?: () => void; action?: ReactNode; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.sm, marginTop: S.md }}>
      <Text style={F.h2}>{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {right}
        {actionLabel ? (
          <TouchableOpacity onPress={onAction} hitSlop={8}>
            <Text style={[F.caption, { color: C.primary, marginLeft: S.sm }]}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : action}
      </View>
    </View>
  )
}

// ---------- Buttons ----------

type BtnVariant = 'primary' | 'soft' | 'ghost' | 'outline' | 'danger' | 'success' | 'white' | 'ai' | 'warning'

export function Btn({
  label, onPress, variant = 'primary', size = 'md', disabled, icon, style, full, loading,
}: {
  label?: string; onPress?: () => void; variant?: BtnVariant; size?: 'sm' | 'md' | 'lg';
  disabled?: boolean; icon?: ReactNode; style?: StyleProp<ViewStyle>; full?: boolean; loading?: boolean;
}) {
  const palettes: Record<BtnVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: C.primary, fg: '#fff' },
    soft: { bg: C.primarySoft, fg: C.primary },
    ghost: { bg: 'transparent', fg: C.text2 },
    outline: { bg: 'transparent', fg: C.primary, border: C.primary + '44' },
    danger: { bg: C.danger, fg: '#fff' },
    success: { bg: C.success, fg: '#fff' },
    white: { bg: '#fff', fg: C.primary },
    ai: { bg: C.ai, fg: '#fff' },
    warning: { bg: C.warning, fg: '#000' },
  }
  const p = palettes[variant]
  const pad = size === 'sm' ? 8 : size === 'lg' ? 15 : 12
  const fs = size === 'sm' ? 12.5 : size === 'lg' ? 16 : 14
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        {
          backgroundColor: p.bg, borderRadius: S.radius, paddingHorizontal: 18, paddingVertical: pad,
          alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
          borderWidth: p.border ? 1.5 : 0, borderColor: p.border,
        },
        full ? { flex: 1 } : null,
        disabled ? { opacity: 0.45 } : null,
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={p.fg} /> : icon}
      {label ? <Text style={{ color: p.fg, fontWeight: '700', fontSize: fs }}>{label}</Text> : null}
    </TouchableOpacity>
  )
}

export function IconBtn({ onPress, children, tone, size = 40 }: { onPress?: () => void; children: ReactNode; tone?: string; size?: number }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={{
        width: size, height: size, borderRadius: size / 2, backgroundColor: tone ?? C.primarySoft,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {children}
    </TouchableOpacity>
  )
}

// ---------- Chips / badges ----------

export function Chip({ label, tone = 'info', onPress, selected, icon }: { label: string; tone?: 'good' | 'bad' | 'info' | 'warn' | 'ai' | 'neutral'; onPress?: () => void; selected?: boolean; icon?: ReactNode }) {
  const colors: Record<string, string> = {
    good: C.successSoft, bad: C.dangerSoft, info: C.primarySoft, warn: C.warningSoft, ai: C.aiSoft, neutral: C.bg,
  }
  const fg: Record<string, string> = {
    good: C.success, bad: C.danger, info: C.primary, warn: C.urgent, ai: C.ai, neutral: C.text2,
  }
  const bg = colors[tone]
  const inner = (
    <View style={[styles.chip, { backgroundColor: bg }, selected ? { borderColor: fg[tone], borderWidth: 1.5 } : null]}>
      {icon}
      <Text style={{ color: fg[tone], fontWeight: '700', fontSize: 12 }}>{label}</Text>
    </View>
  )
  return onPress ? (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>{inner}</TouchableOpacity>
  ) : inner
}

export function Delta({ delta, suffix = 'pts', hideZero }: { delta: number; suffix?: string; hideZero?: boolean }) {
  if (delta === 0 && hideZero) return null
  const up = delta > 0
  const color = up ? C.success : C.danger
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: up ? C.successSoft : C.dangerSoft, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 }}>
      <Text style={{ color, fontWeight: '800', fontSize: 12 }}>{up ? '↑' : '↓'}{Math.abs(delta)}{suffix ? ` ${suffix}` : ''}</Text>
    </View>
  )
}

export function Avatar({ name, hue, size = 38, ring, url }: { name: string; hue: number; size?: number; ring?: boolean; url?: string | null }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center',
        backgroundColor: `hsl(${hue}, 78%, ${ring ? 92 : 94}%)`,
        borderWidth: ring ? 2 : 0, borderColor: `hsl(${hue}, 70%, 60%)`, overflow: 'hidden',
      }}
    >
      {url ? (
        <Image source={{ uri: url }} style={{ width: size, height: size }} />
      ) : (
        <Text style={{ color: `hsl(${hue}, 62%, 34%)`, fontWeight: '800', fontSize: size * 0.36 }}>{initials}</Text>
      )}
    </View>
  )
}

// ---------- Stats / meters ----------

export function Stat({ label, value, sub, tone, icon, small }: { label: string; value: string; sub?: string; tone?: 'good' | 'bad' | 'warn' | 'info'; icon?: ReactNode; small?: boolean }) {
  const fg = tone === 'good' ? C.success : tone === 'bad' ? C.danger : tone === 'warn' ? C.urgent : C.primary
  return (
    <View style={[styles.card, { flex: 1, padding: small ? 12 : 14 }]}>
      {icon}
      <Text style={[F.micro, { marginTop: icon ? 6 : 0, color: C.text3 }]}>{label.toUpperCase()}</Text>
      <Text style={[{ fontSize: small ? 19 : 23, fontWeight: '800', color: C.text, marginTop: 2, letterSpacing: -0.4 }, tone ? { color: fg } : null]}>{value}</Text>
      {sub ? <Text style={[F.caption, { marginTop: 2 }]}>{sub}</Text> : null}
    </View>
  )
}

export function Ring({ value, size = 74, stroke = 7, color, track = C.border, label, sub }: { value: number; size?: number; stroke?: number; color?: string; track?: string; label?: string; sub?: string }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  const c = color ?? (pct >= 90 ? C.success : pct >= 75 ? C.primary : pct >= 60 ? C.warning : C.danger)
  const { default: Svg, Circle } = require('react-native-svg') as typeof import('react-native-svg')
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r} stroke={c} strokeWidth={stroke} fill="none"
          strokeDasharray={`${circ}`} strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        {label ? <Text style={[F.caption, { fontSize: 9 }]}>{label}</Text> : null}
        <Text style={{ fontSize: size * 0.2, fontWeight: '800', color: c, letterSpacing: -0.5 }}>{Math.round(value)}%</Text>
        {sub ? <Text style={{ fontSize: 8.5, color: C.text3, fontWeight: '600' }}>{sub}</Text> : null}
      </View>
    </View>
  )
}

export function Meter({ value, color, height = 8 }: { value: number; color?: string; height?: number }) {
  const c = color ?? (value >= 90 ? C.success : value >= 75 ? C.primary : value >= 60 ? C.warning : C.danger)
  return (
    <View style={{ height, borderRadius: height, backgroundColor: C.border, overflow: 'hidden', flex: 1 }}>
      <View style={{ width: `${Math.max(2, Math.min(100, value))}%`, height, borderRadius: height, backgroundColor: c }} />
    </View>
  )
}

// ---------- Inputs ----------

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ marginBottom: S.md }}>
      <Text style={[F.caption, { marginBottom: 6 }]}>{label}</Text>
      {children}
    </View>
  )
}

export function Input({ value, onChangeText, placeholder, multiline, keyboardType, style }: { value: string; onChangeText: (t: string) => void; placeholder?: string; multiline?: boolean; keyboardType?: 'numeric' | 'default'; style?: StyleProp<TextStyle> }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={C.text3}
      multiline={multiline}
      keyboardType={keyboardType}
      style={[
        {
          backgroundColor: C.bg, borderRadius: S.radius, paddingHorizontal: 14, paddingVertical: multiline ? 12 : 11,
          fontSize: 14.5, color: C.text, borderWidth: 1.5, borderColor: C.border, minHeight: multiline ? 90 : 44,
        },
        style,
      ]}
    />
  )
}

export function Segmented<T extends string>({ options, value, onChange, tone }: { options: { key: T; label: string }[]; value: T; onChange: (k: T) => void; tone?: string }) {
  const active = tone ?? C.primary
  return (
    <View style={{ flexDirection: 'row', backgroundColor: C.bg, borderRadius: S.radius, padding: 3, borderWidth: 1, borderColor: C.border }}>
      {options.map((o) => {
        const sel = o.key === value
        return (
          <TouchableOpacity key={o.key} activeOpacity={0.8} onPress={() => onChange(o.key)} style={{ flex: 1, paddingVertical: 8, borderRadius: S.radius - 3, backgroundColor: sel ? '#fff' : 'transparent', alignItems: 'center', ...(sel ? shadow.card : null) }}>
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: sel ? active : C.text3 }}>{o.label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search…' }: { value: string; onChange: (t: string) => void; placeholder?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: S.radius, paddingHorizontal: 14, borderWidth: 1.5, borderColor: C.border }}>
      <Text style={{ color: C.text3, fontSize: 15 }}>⌕</Text>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={C.text3}
        style={{ flex: 1, paddingVertical: 11, marginLeft: 8, fontSize: 14, color: C.text }}
      />
      {value ? <Pressable onPress={() => onChange('')} hitSlop={8}><Text style={{ color: C.text3 }}>✕</Text></Pressable> : null}
    </View>
  )
}

// ---------- Bottom sheet modal ----------

export function Sheet({ visible, onClose, title, children, snap = 0.72 }: { visible: boolean; onClose: () => void; title: string; children: ReactNode; snap?: number }) {
  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: S.lg, paddingBottom: 36, maxHeight: '88%', minHeight: '40%' }}>
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: C.border, marginBottom: S.md }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.md }}>
            <Text style={F.h1}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}><Text style={{ color: C.text3, fontSize: 18, fontWeight: '700' }}>✕</Text></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </RNModal>
  )
}

// ---------- Misc ----------

export function EmptyState({ icon = '◌', title, sub, action }: { icon?: string; title: string; sub?: string; action?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: S.md }}>
        <Text style={{ fontSize: 22, color: C.primary }}>{icon}</Text>
      </View>
      <Text style={[F.h2, { textAlign: 'center' }]}>{title}</Text>
      {sub ? <Text style={[F.body2, { textAlign: 'center', marginTop: 4 }]}>{sub}</Text> : null}
      {action ? <View style={{ marginTop: S.lg }}>{action}</View> : null}
    </View>
  )
}

export function Skeleton({ width = '100%', height = 16, radius = 8, style }: { width?: DimensionValue; height?: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ width, height, borderRadius: radius, backgroundColor: C.border }, style]} />
}

export function Divider({ m = S.md }: { m?: number }) {
  return <View style={{ height: 1, backgroundColor: C.border, marginVertical: m }} />
}

export function Notice({ tone = 'info', children, onPress }: { tone?: 'info' | 'success' | 'warn' | 'danger' | 'ai'; children: ReactNode; onPress?: () => void }) {
  const colors = {
    info: { bg: C.primarySoft, fg: C.primary },
    success: { bg: C.successSoft, fg: C.success },
    warn: { bg: C.warningSoft, fg: C.urgent },
    danger: { bg: C.dangerSoft, fg: C.danger },
    ai: { bg: C.aiSoft, fg: C.ai },
  }
  const c = colors[tone]
  const inner = (
    <View style={{ backgroundColor: c.bg, borderRadius: S.radius, padding: S.md, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <Text style={{ color: c.fg, fontWeight: '800', marginTop: 1 }}>!</Text>
      <Text style={{ color: c.fg === C.ai ? C.text2 : c.fg, fontSize: 13, flex: 1, lineHeight: 18 }}>{children}</Text>
    </View>
  )
  return onPress ? <TouchableOpacity activeOpacity={0.8} onPress={onPress}>{inner}</TouchableOpacity> : inner
}

export function AiBadge() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: C.aiSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 }}>
      <Text style={{ fontSize: 10, color: C.ai, fontWeight: '800' }}>✦</Text>
      <Text style={{ fontSize: 10, color: C.ai, fontWeight: '800', letterSpacing: 0.5 }}>AI</Text>
    </View>
  )
}

export function Row({ children, between, gap = S.md, style, align = 'center' }: { children: ReactNode; between?: boolean; gap?: number; style?: StyleProp<ViewStyle>; align?: 'center' | 'flex-start' | 'flex-end' | 'stretch' }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: align, gap }, between ? { justifyContent: 'space-between' } : null, style]}>
      {children}
    </View>
  )
}

export function ListItem({ title, sub, right, onPress, icon, tone }: { title: string; sub?: string; right?: ReactNode; onPress?: () => void; icon?: ReactNode; tone?: string }) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} disabled={!onPress} style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}>
      {icon ? <View style={{ marginRight: S.md }}>{icon}</View> : null}
      <View style={{ flex: 1 }}>
        <Text style={[F.h3, { color: tone ?? C.text }]} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={[F.caption, { marginTop: 2 }]} numberOfLines={2}>{sub}</Text> : null}
      </View>
      {right}
      {onPress ? <Text style={{ color: C.text3, fontSize: 17, marginLeft: 6 }}>›</Text> : null}
    </TouchableOpacity>
  )
}

export function GradientHero({ children, height = 148, color = C.primary }: { children: ReactNode; height?: number; color?: string }) {
  return (
    <View style={{ backgroundColor: color, borderRadius: S.radiusLg, padding: S.lg, minHeight: height, ...shadow.float }}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: S.radius,
    padding: S.lg,
    borderWidth: 1,
    borderColor: C.border,
    ...shadow.card,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: S.md, gap: S.md,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    borderWidth: 1, borderColor: 'transparent',
  },
})

export { Platform, C as colors }