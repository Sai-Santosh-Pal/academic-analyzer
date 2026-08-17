import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Meter, SectionHeader } from '@/components/ui'
import { BarChart } from '@/components/charts'
import { studentByUser, strengthMap, subjectSeries, subjectAvg, subjectTrend } from '@/data/stats'
import { formatShort } from '@/utils/date'
import { LineChart } from '@/components/charts'

export default function SubjectsScreen() {
  const params = useLocalSearchParams<{ subjectId?: string }>()
  const { db, user } = useStore()
  const router = useRouter()
  const student = studentByUser(db, user?.id ?? '')
  const [selected, setSelected] = React.useState<string | null>(params.subjectId ?? null)
  if (!student) return null

  const strengths = strengthMap(db, student.id)
  const activeId = selected ?? strengths[0]?.subjectId
  const active = strengths.find((s) => s.subjectId === activeId) ?? strengths[0]
  if (!active) return <Screen><Header title="Subjects" /><Text style={[F.body2, { textAlign: 'center', marginTop: 40 }]}>No subject data yet.</Text></Screen>

  const series = subjectSeries(db, student.id, active.subjectId)
  const t = subjectTrend(db, student.id, active.subjectId)

  return (
    <Screen scroll>
      <Header title="Subjects" subtitle="Performance by subject" />
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: S.md }}>
        {strengths.map((s) => (
          <TouchableOpacity key={s.subjectId} activeOpacity={0.8} onPress={() => setSelected(s.subjectId)}>
            <View style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 12, backgroundColor: s.subjectId === activeId ? s.color : C.card, borderWidth: 1, borderColor: s.subjectId === activeId ? s.color : C.border }}>
              <Text style={{ fontSize: 12.5, fontWeight: '800', color: s.subjectId === activeId ? '#fff' : C.text2 }}>{s.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Card style={{ borderWidth: 1, borderColor: active.color + '55' }}>
        <Row between>
          <View>
            <Text style={[F.micro, { color: active.color }]}>{active.name.toUpperCase()}</Text>
            <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -1, marginTop: 2 }}>{Math.round(active.avg)}%</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[F.caption, { color: t.dir === 'improving' ? C.success : t.dir === 'declining' ? C.danger : C.text3, fontWeight: '800' }]}>
              {t.dir === 'improving' ? '↑ Improving' : t.dir === 'declining' ? '↓ Declining' : 'Stable'} ({t.delta >= 0 ? '+' : ''}{t.delta})
            </Text>
            <Text style={[F.caption, { marginTop: 4 }]}>{series.length} assessments</Text>
          </View>
        </Row>
        {series.length > 1 ? (
          <View style={{ marginTop: S.md }}>
            <LineChart data={series.map((x) => x.pct)} labels={series.map((x) => formatShort(x.date))} color={active.color} height={130} />
          </View>
        ) : null}
      </Card>

      <SectionHeader title="All subjects" />
      <Card>
        <BarChart data={strengths.map((s) => ({ label: s.name.slice(0, 7), value: s.avg, color: s.color }))} height={150} />
      </Card>
    </Screen>
  )
}