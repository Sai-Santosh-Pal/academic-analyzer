import React from 'react'
import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, SectionHeader, Notice } from '@/components/ui'
import { parentOf } from '@/data/stats'

export default function ParentReportDetail() {
  const params = useLocalSearchParams<{ id: string }>()
  const { db, user } = useStore()
  const parent = parentOf(db, user?.id ?? '')
  const report = db.reports.find((r) => r.id === String(params.id))
  if (!report) return <Screen><Header title="Report" /><Text>Not found</Text></Screen>
  let parsed: { title: string; summary: string; sections: { heading: string; points: string[] }[] } | null = null
  try { parsed = JSON.parse(report.content) } catch { /* keep null */ }

  return (
    <Screen scroll>
      <Header title={report.title} subtitle={`${report.type} · ${report.period}`} />
      {parsed ? (
        <>
          <Card>
            <Text style={[F.body2, { lineHeight: 20 }]}>{parsed.summary}</Text>
          </Card>
          {parsed.sections.map((s) => (
            <View key={s.heading}>
              <SectionHeader title={s.heading} />
              <Card>
                {s.points.map((p, i) => (
                  <Row key={i} gap={8} style={{ paddingVertical: 4 }}>
                    <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.primary, marginTop: 6 }} />
                    <Text style={[F.body2, { flex: 1, lineHeight: 18 }]}>{p}</Text>
                  </Row>
                ))}
              </Card>
            </View>
          ))}
        </>
      ) : (
        <Card>
          <Text style={F.body2}>{report.content}</Text>
        </Card>
      )}
      <Notice tone="info">This report is shared by your child's school. Questions? Contact the class teacher directly.</Notice>
    </Screen>
  )
}

function Row({ children, gap, style }: { children: React.ReactNode; gap?: number; style?: any }) {
  return <View style={{ flexDirection: 'row', gap, ...style }}>{children}</View>
}