import React from 'react'
import { View, Text } from 'react-native'
import { C, F, S } from '../theme'
import { Card, Delta } from './ui'

export interface ChangeItem {
  label: string
  value: string
  delta: number
  sub?: string
  color: string
  tone?: 'good' | 'bad' | 'info'
}

export function WhatChangedStrip({ title = 'WHAT CHANGED?', items }: { title?: string; items: ChangeItem[] }) {
  return (
    <Card style={{ borderColor: C.primary + '30' }}>
      <Text style={[F.micro, { color: C.primary, letterSpacing: 1.2 }]}>{title}</Text>
      <View style={{ marginTop: 10, gap: 10 }}>
        {items.map((it, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 4, height: 34, borderRadius: 2, backgroundColor: it.color }} />
            <View style={{ flex: 1 }}>
              <Text style={[F.h3, { fontSize: 13.5 }]}>{it.label}</Text>
              <Text style={[F.caption, { marginTop: 1 }]} numberOfLines={1}>{it.sub}</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: C.text }}>{it.value}</Text>
            <Delta delta={it.delta} hideZero />
          </View>
        ))}
      </View>
    </Card>
  )
}