import React, { useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Avatar, Chip, Btn, SectionHeader, Notice } from '@/components/ui'
import { Icon } from '@/components/icons'
import { LineChart } from '@/components/charts'
import { AIResultView } from '@/components/ai-result-view'
import { useAI } from '@/hooks/use-ai'
import { className, overallAvg, attendanceStats, overallTrend, subjectTrend, subjectSeries, subjectName, strengthMap, earlyWarningFlags, gradeFor } from '@/data/stats'

export default function AdminStudentDetail() {
  const params = useLocalSearchParams<{ studentId: string }>()
  const { db, user } = useStore()
  const router = useRouter()
  const { loading, source, run } = useAI()
  const [result, setResult] = useState<Awaited<ReturnType<typeof run>> | null>(null)
  const student = db.students.find((s) => s.id === String(params.studentId))
  if (!student) return <Screen><Header title="Student" /><Text>Not found</Text></Screen>
  const u = db.users.find((x) => x.id === student.userId)!
  const cls = db.classes.find((c) => c.id === student.classId)!
  const overall = overallAvg(db, student.id)
  const att = attendanceStats(db, student.id)
  const trend = overallTrend(db, student.id)
  const flags = earlyWarningFlags(db).filter((f) => f.studentId === student.id)
  const links = db.parentLinks.filter((l) => l.studentId === student.id)
  const parents = links.map((l) => db.parents.find((p) => p.id === l.parentId)!).filter(Boolean)

  const investigate = async () => {
    setResult(null)
    const r = await run(db, { kind: 'student_investigation', params: { studentId: student.id }, role: 'admin' })
    setResult(r)
  }

  return (
    <Screen scroll>
      <Header title="Student" subtitle={`${cls.name} ${cls.section} · Roll ${student.rollNumber}`} />
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar name={u.name} hue={u.avatarHue} size={46} />
        <View style={{ flex: 1 }}>
          <Text style={F.h2}>{u.name}</Text>
          <Text style={[F.caption, { marginTop: 2 }]}>Overall {overall !== null ? Math.round(overall) : '—'}% · Grade {overall !== null ? gradeFor(overall).grade : '—'} · Attendance {att.pct}%</Text>
        </View>
        <Btn label="Investigate" variant="ai" size="sm" onPress={investigate} />
      </Card>

      {flags.length ? (
        <View style={{ marginTop: S.md, gap: 8 }}>
          {flags.map((f) => (
            <Card key={f.studentId} style={{ backgroundColor: f.level === 'urgent' ? C.dangerSoft : C.warningSoft, borderColor: (f.level === 'urgent' ? C.danger : C.warning) + '55' }}>
              <Row gap={8}><Icon name="alert" size={16} color={f.level === 'urgent' ? C.danger : C.warning} /><Text style={[F.body2, { fontWeight: '800', color: f.level === 'urgent' ? C.danger : C.warning, flex: 1 }]}>{f.reasons.join(' · ')}</Text></Row>
              {f.suggestion ? <Text style={[F.caption, { marginTop: 4 }]}>{f.suggestion}</Text> : null}
            </Card>
          ))}
        </View>
      ) : null}

      <SectionHeader title="Overall trend" />
      <Card>
        <LineChart data={trend.series.map((p) => p.value)} labels={trend.series.map((p) => p.shortLabel)} color={trend.dir === 'declining' ? C.danger : C.primary} height={140} />
      </Card>

      <SectionHeader title="Subjects" />
      <View style={{ gap: 8 }}>
        {strengthMap(db, student.id).map((s) => {
          const series = subjectSeries(db, student.id, s.subjectId)
          return (
            <Card key={s.subjectId}>
              <Row between>
                <Row gap={8}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
                  <Text style={[F.body2, { fontWeight: '700' }]}>{s.name}</Text>
                </Row>
                <Row gap={8}>
                  <Text style={{ fontWeight: '800' }}>{Math.round(s.avg)}%</Text>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: s.dir === 'improving' ? C.success : s.dir === 'declining' ? C.danger : C.text3 }}>{s.dir === 'improving' ? '↑' : s.dir === 'declining' ? '↓' : '→'} {s.delta >= 0 ? '+' : ''}{s.delta}</Text>
                </Row>
              </Row>
              {series.length > 1 ? (
                <View style={{ marginTop: 8 }}>
                  <LineChart data={series.map((p) => p.pct)} labels={[]} color={s.color} height={46} showDots={false} fill={false} />
                </View>
              ) : null}
            </Card>
          )
        })}
      </View>

      <SectionHeader title="Family" />
      <Card>
        {parents.map((p) => {
          const pu = db.users.find((x) => x.id === p.userId)!
          return <Text key={p.id} style={[F.body2, { paddingVertical: 4 }]}>{pu.name}</Text>
        })}
        {!parents.length ? <Text style={F.caption}>No parents linked.</Text> : null}
      </Card>

      {loading ? (
        <Card style={{ marginTop: S.md, alignItems: 'center', paddingVertical: 26 }}>
          <ActivityIndicator size="large" color={C.ai} />
        </Card>
      ) : null}
      {result ? (
        <View style={{ marginTop: S.md }}>
          <AIResultView result={result} source={source} sourceNote={source === 'local' ? 'AI service unreachable — built-in analytics engine used.' : undefined} />
        </View>
      ) : null}
    </Screen>
  )
}