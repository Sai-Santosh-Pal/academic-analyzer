import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { AIResult } from '../ai/fallback'
import { C, F, S } from '../theme'
import { Card, AiBadge, Notice, Divider, Row, Chip } from './ui'
import { Icon } from './icons'

export function AIResultView({ result, source, sourceNote, compact }: { result: AIResult; source: 'ai' | 'local'; sourceNote?: string; compact?: boolean }) {
  return (
    <View style={{ gap: S.md }}>
      <Card style={{ backgroundColor: C.aiSoft, borderColor: C.ai + '30' }}>
        <Row between>
          <Row gap={6}>
            <AiBadge />
            {source === 'local' ? <Chip label="Offline engine" tone="neutral" /> : null}
          </Row>
        </Row>
        <Text style={[F.h2, { marginTop: S.sm, color: C.ai }]}>{result.title}</Text>
        <Text style={[F.body2, { marginTop: 6, lineHeight: 20 }]}>{result.summary}</Text>
        {sourceNote ? <Text style={[F.caption, { marginTop: 6 }]}>{sourceNote}</Text> : null}
        {result.stats.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: S.md }}>
            {result.stats.map((s, i) => (
              <View key={i} style={{ backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, minWidth: 76 }}>
                <Text style={[F.micro, { fontSize: 8.5 }]}>{s.label.toUpperCase()}</Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: C.primaryDark, marginTop: 1 }}>{s.value}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      {result.plan?.length ? (
        <Card>
          <Text style={F.h2}>Plan</Text>
          <View style={{ marginTop: S.sm, gap: S.md }}>
            {result.plan.map((d, di) => (
              <View key={di} style={{ gap: 5 }}>
                <Row between>
                  <Text style={[F.h3, { color: C.primary }]}>{d.label}</Text>
                  <Text style={F.caption}>{d.items.reduce((a, i) => a + i.minutes, 0)} min</Text>
                </Row>
                {d.items.map((it, ii) => (
                  <Row key={ii} gap={8} style={{ backgroundColor: C.bg, borderRadius: 10, padding: 9 }}>
                    <View style={{ width: 34, alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: C.primary }}>{it.minutes}</Text>
                      <Text style={{ fontSize: 8, color: C.text3, fontWeight: '700' }}>MIN</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[F.h3, { fontSize: 13.5 }]}>{it.subject}</Text>
                      <Text style={[F.caption, { marginTop: 1 }]}>{it.activity}</Text>
                    </View>
                  </Row>
                ))}
              </View>
            ))}
          </View>
          {result.estimate ? <Notice tone="warn"><Text>Estimated scenario — not a guaranteed outcome.</Text></Notice> : null}
        </Card>
      ) : null}

      {result.sections.map((sec, i) => (
        <Card key={i}>
          <Text style={F.h2}>{sec.heading}</Text>
          <View style={{ marginTop: S.sm, gap: 7 }}>
            {sec.points.map((p, pi) => (
              <View key={pi} style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={{ color: C.primary, fontWeight: '800', fontSize: 12, marginTop: 2 }}>•</Text>
                <Text style={[F.body2, { flex: 1, lineHeight: 19 }]}>{p}</Text>
              </View>
            ))}
          </View>
        </Card>
      ))}

      {result.recommendations.length ? (
        <Card>
          <Row gap={6}>
            <Icon name="zap" size={16} color={C.warning} />
            <Text style={F.h2}>Recommended next steps</Text>
          </Row>
          <View style={{ marginTop: S.sm, gap: 8 }}>
            {result.recommendations.map((r, i) => (
              <Row key={i} gap={10} align="flex-start">
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.warningSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: C.urgent }}>{i + 1}</Text>
                </View>
                <Text style={[F.body2, { flex: 1, lineHeight: 19 }]}>{r}</Text>
              </Row>
            ))}
          </View>
        </Card>
      ) : null}
    </View>
  )
}