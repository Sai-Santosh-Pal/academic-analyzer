import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Ring, Row, SectionHeader, Chip, Delta, EmptyState } from '@/components/ui'
import { Icon } from '@/components/icons'
import { LineChart, BarChart, Legend } from '@/components/charts'
import {
  studentByUser, overallAvg, gradeFor, strengthMap, subjectSeries, attendanceStats,
  monthlyAttendance, detectStudentChanges, subjectTrend, subjectAvg,
} from '@/data/stats'
import { formatShort } from '@/utils/date'

export default function StudentPerformance() {
  const { db, user } = useStore()
  const router = useRouter()
  const student = studentByUser(db, user?.id ?? '')
  if (!student) return null

  const overall = overallAvg(db, student.id) ?? 0
  const grade = gradeFor(overall)
  const strengths = strengthMap(db, student.id)
  const changes = detectStudentChanges(db, student.id)
  const att = attendanceStats(db, student.id)
  const monthly = monthlyAttendance(db, student.id)

  const allSeries = strengthMap(db, student.id).flatMap((s) => subjectSeries(db, student.id, s.subjectId).map((x) => ({ ...x, subject: s.name })))
  const chartData = allSeries.sort((a, b) => a.date.localeCompare(b.date)).map((x) => x.pct)
  const chartLabels = allSeries.map((x) => formatShort(x.date)).slice(0, 12)
  const bySubject: Record<string, typeof allSeries> = {}
  for (const x of allSeries) (bySubject[x.subject] ??= []).push(x)

  const prevTerm = overallAvg(db, student.id, 28)
  const trend = overall !== null && prevTerm !== null ? overall - prevTerm : 0

  return (
    <Screen scroll>
      <Header title="Performance" subtitle="Your academic progress, analysed" />
      <Card style={{ backgroundColor: C.primarySoft, borderColor: C.primary + '30' }}>
        <Row between>
          <View>
            <Text style={[F.caption, { color: C.primary }]}>OVERALL PERFORMANCE</Text>
            <Text style={{ fontSize: 38, fontWeight: '900', color: C.text, letterSpacing: -1, marginTop: 2 }}>{Math.round(overall)}%</Text>
            <Row gap={8} style={{ marginTop: 4 }}>
              <Chip label={`Grade ${grade.grade}`} tone="info" />
              <Chip label={`${trend >= 0 ? '+' : ''}${Math.round(trend)} vs 4 weeks ago`} tone={trend >= 0 ? 'good' : 'bad'} />
            </Row>
          </View>
          <Ring value={overall} size={92} stroke={8} label="TERM" sub={`${grade.grade}`} />
        </Row>
      </Card>

      <SectionHeader title="Performance over time" />
      <Card>
        {chartData.length > 1 ? <LineChart data={chartData} labels={chartLabels.slice(-6)} height={160} /> : <EmptyState icon="trend" title="Not enough data yet" sub="Scores from completed assessments will appear here." />}
      </Card>

      <SectionHeader title="Subject comparison" />
      <Card>
        <BarChart data={strengths.map((s) => ({ label: s.name.slice(0, 6), value: s.avg, color: s.color }))} height={170} />
        <Legend items={strengths.slice(0, 5).map((s) => ({ label: s.name, color: s.color, value: `${Math.round(s.avg)}%` }))} />
      </Card>

      {bySubject && Object.keys(bySubject).length > 1 ? (
        <>
          <SectionHeader title="Subject trends" />
          <View style={{ gap: 8 }}>
            {strengths.map((s) => {
              const series = bySubject[s.name]?.map((x) => x.pct) ?? []
              const t = subjectTrend(db, student.id, s.subjectId)
              return (
                <Card key={s.subjectId} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
                  <View style={{ flex: 1 }}>
                    <Text style={F.h3}>{s.name}</Text>
                    <Text style={[F.caption, { marginTop: 1 }]}>avg {Math.round(s.avg)}% · {t.dir}</Text>
                  </View>
                  {series.length > 1 ? <LineChart data={series} color={s.color} width={110} height={36} showDots={false} fill={false} strokeWidth={2} /> : null}
                </Card>
              )
            })}
          </View>
        </>
      ) : null}

      <SectionHeader title="Attendance trend" actionLabel="Details" onAction={() => router.push('/student/attendance')} />
      <Card>
        {monthly.length > 1 ? <LineChart data={monthly.map((m) => m.pct)} labels={monthly.map((m) => m.month.slice(0, 3))} color={C.success} height={140} /> : null}
        <Row between style={{ marginTop: S.sm }}>
          <Text style={F.caption}>Overall attendance</Text>
          <Text style={{ fontWeight: '800', color: C.success }}>{att.pct}%</Text>
        </Row>
      </Card>

      <SectionHeader title="Strengths & weak areas" />
      <Card>
        <Text style={[F.micro, { color: C.success }]}>STRENGTHS</Text>
        <View style={{ marginTop: 6, gap: 6 }}>
          {strengths.slice(0, 2).map((s) => (
            <Row key={s.subjectId} between>
              <Text style={F.body2}>{s.name}</Text>
              <Text style={{ fontWeight: '800', color: C.success }}>{Math.round(s.avg)}%</Text>
            </Row>
          ))}
        </View>
        <View style={{ height: 1, backgroundColor: C.border, marginVertical: S.md }} />
        <Text style={[F.micro, { color: C.danger }]}>WEAK AREAS</Text>
        <View style={{ marginTop: 6, gap: 6 }}>
          {strengths.slice(-2).map((s) => (
            <Row key={s.subjectId} between>
              <Text style={F.body2}>{s.name}</Text>
              <Text style={{ fontWeight: '800', color: C.danger }}>{Math.round(s.avg)}%</Text>
            </Row>
          ))}
        </View>
      </Card>

      <SectionHeader title="Assessment history" />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {allSeries.slice(-12).reverse().map((x, i, arr) => {
          const prev = arr[i + 1]
          const delta = prev ? x.pct - prev.pct : 0
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 13, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
              <View style={{ flex: 1 }}>
                <Text style={[F.h3, { fontSize: 13.5 }]}>{x.subject} · {x.title}</Text>
                <Text style={[F.caption, { marginTop: 1 }]}>{formatShort(x.date)}</Text>
              </View>
              <Text style={{ fontWeight: '800', fontSize: 15 }}>{x.pct}%</Text>
              {delta !== 0 ? <View style={{ marginLeft: 8 }}><Delta delta={delta} suffix="" /></View> : null}
            </View>
          )
        })}
      </Card>
    </Screen>
  )
}