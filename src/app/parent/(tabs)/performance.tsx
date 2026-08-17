import React from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore } from '@/data/store'
import { useSelectedChildId } from '@/data/parent-select'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, SectionHeader, Chip, Notice } from '@/components/ui'
import { LineChart, BarChart, DonutChart } from '@/components/charts'
import { ChildSwitcher } from '@/components/child-switcher'
import { parentOf, linkedChildren, classOf, subjectTrend, subjectSeries, overallTrend, gradeFor, attendanceStats, assignmentStats, subjectName } from '@/data/stats'

export default function ParentPerformance() {
  const { db, user } = useStore()
  const router = useRouter()
  const parent = parentOf(db, user?.id ?? '')
  const selected = useSelectedChildId()
  if (!parent) return null
  const child = (linkedChildren(db, parent.id).find((c) => c.id === selected) ?? linkedChildren(db, parent.id)[0])
  if (!child) return null
  const cls = classOf(db, child.id)!
  const trend = overallTrend(db, child.id)
  const att = attendanceStats(db, child.id)
  const asg = assignmentStats(db, child.id)
  const subjects = trend.series.length ? cls.subjectIds.map((sid) => db.subjects.find((x) => x.id === sid)!).filter(Boolean) : []

  return (
    <Screen scroll>
      <Header title="Progress" subtitle="Subject trends, attendance & workload" />
      {linkedChildren(db, parent.id).length > 1 ? (
        <View style={{ marginBottom: S.md }}>
          <ChildSwitcher />
        </View>
      ) : null}

      <Card>
        <Row between style={{ marginBottom: 8 }}>
          <Text style={F.h3}>Overall trend</Text>
          <Chip label={trend.dir === 'improving' ? 'Improving' : trend.dir === 'declining' ? 'Declining' : 'Stable'} tone={trend.dir === 'improving' ? 'good' : trend.dir === 'declining' ? 'bad' : 'neutral'} />
        </Row>
        <LineChart
          data={trend.series.map((p) => p.value)}
          labels={trend.series.map((p) => p.shortLabel)}
          color={trend.dir === 'declining' ? C.danger : C.primary}
          height={150}
        />
        <Text style={[F.caption, { marginTop: 6 }]}>Last score {Math.round(trend.series[trend.series.length - 1]?.value ?? 0)}% · Grade {gradeFor(trend.series[trend.series.length - 1]?.value ?? 0).grade}</Text>
      </Card>

      <SectionHeader title="By subject" />
      <Card>
        {subjects.map((s) => {
          const t = subjectTrend(db, child.id, s.id)
          const series = subjectSeries(db, child.id, s.id)
          return (
            <Row key={s.id} gap={10} style={{ paddingVertical: 7 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
              <View style={{ flex: 1 }}>
                <Text style={[F.body2, { fontWeight: '700' }]}>{s.name}</Text>
              </View>
              {series.length ? (
                <View style={{ width: 96, height: 26 }}>
                  <LineChart data={series.map((p) => p.pct)} labels={[]} color={t.dir === 'declining' ? C.danger : s.color} height={26} showDots={false} fill={false} />
                </View>
              ) : null}
              <Text style={{ fontWeight: '800', width: 42, textAlign: 'right' }}>{Math.round(series[series.length - 1]?.pct ?? 0)}%</Text>
            </Row>
          )
        })}
      </Card>

      <SectionHeader title="Attendance & workload" />
      <Card>
        <DonutChart segments={[{ value: att.pct, color: att.pct >= 90 ? C.success : C.warning, label: 'Attendance' }]} centerValue={`${att.pct}%`} centerLabel="Attendance" size={96} />
        {att.pct < 90 ? <Notice tone="warn">Attendance is below the 90% benchmark. Regular attendance is the strongest predictor of outcomes.</Notice> : null}
        <View style={{ marginTop: S.md }}>
          <Row between style={{ paddingVertical: 6 }}><Text style={F.body2}>Assignments submitted</Text><Text style={{ fontWeight: '800', color: C.success }}>{asg.submitted}</Text></Row>
          <Row between style={{ paddingVertical: 6 }}><Text style={F.body2}>Pending</Text><Text style={{ fontWeight: '800', color: C.warning }}>{asg.pending}</Text></Row>
          <Row between style={{ paddingVertical: 6 }}><Text style={F.body2}>Missing</Text><Text style={{ fontWeight: '800', color: C.danger }}>{asg.missing}</Text></Row>
        </View>
      </Card>
    </Screen>
  )
}