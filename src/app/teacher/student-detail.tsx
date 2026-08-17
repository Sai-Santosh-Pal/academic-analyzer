import React, { useState } from 'react'
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, Avatar, Btn, SectionHeader, Notice, AiBadge, Delta } from '@/components/ui'
import { Icon } from '@/components/icons'
import { WhatChangedStrip } from '@/components/what-changed'
import { AIResultView } from '@/components/ai-result-view'
import { useAI } from '@/hooks/use-ai'
import {
  studentOf, userOf, classOf, className, overallAvg, attendanceStats, assignmentStats,
  strengthMap, detectStudentChanges, subjectSeries, gradeFor, earlyWarningFlags,
  subjectTrend, studentAssignments, classPulse,
} from '@/data/stats'
import { formatHuman, formatShort } from '@/utils/date'
import { Sparkline } from '@/components/charts'

export default function StudentDetailScreen() {
  const params = useLocalSearchParams<{ studentId: string }>()
  const { db, user } = useStore()
  const router = useRouter()
  const { loading, source, run } = useAI()
  const [aiResult, setAiResult] = useState<Awaited<ReturnType<typeof run>> | null>(null)
  const [aiShown, setAiShown] = useState(false)

  const student = studentOf(db, String(params.studentId))
  if (!student) return <Screen><Header title="Student" /><Text>Not found</Text></Screen>
  const u = userOf(db, student.userId)!
  const cls = classOf(db, student.id)!
  const overall = overallAvg(db, student.id)
  const att = attendanceStats(db, student.id)
  const asg = assignmentStats(db, student.id)
  const grade = gradeFor(overall ?? 0)
  const strengths = strengthMap(db, student.id)
  const changes = detectStudentChanges(db, student.id)
  const flags = earlyWarningFlags(db, student.classId).find((f) => f.studentId === student.id)
  const assignments = studentAssignments(db, student.id).filter((s) => s.status !== 'submitted')
  const parentLinks = db.parentLinks.filter((l) => l.studentId === student.id)

  const investigate = async () => {
    setAiShown(true)
    setAiResult(null)
    const r = await run(db, { kind: 'student_investigation', params: { studentId: student.id }, role: 'teacher' })
    setAiResult(r)
  }

  return (
    <Screen scroll>
      <Header title={u.name} subtitle={`${className(db, student.classId)} · Roll ${student.rollNumber}`} />
      <Card>
        <Row gap={14}>
          <Avatar name={u.name} hue={u.avatarHue} size={54} />
          <View style={{ flex: 1 }}>
            <Text style={F.h1}>{u.name}</Text>
            <Row gap={6} style={{ marginTop: 4 }}>
              <Chip label={`Grade ${grade.grade}`} tone="info" />
              <Chip label={`Overall ${overall !== null ? Math.round(overall) : '—'}%`} tone={overall !== null && overall >= 60 ? 'good' : 'bad'} />
            </Row>
          </View>
        </Row>
        <Row gap={8} style={{ marginTop: S.md }}>
          <Card style={{ flex: 1, padding: 10, backgroundColor: C.bg }}><Text style={F.caption}>ATTENDANCE</Text><Text style={{ fontSize: 17, fontWeight: '800', color: att.pct >= 90 ? C.success : C.danger }}>{att.pct}%</Text></Card>
          <Card style={{ flex: 1, padding: 10, backgroundColor: C.bg }}><Text style={F.caption}>ASSIGNMENTS</Text><Text style={{ fontSize: 17, fontWeight: '800' }}>{asg.completion}%</Text></Card>
          <Card style={{ flex: 1, padding: 10, backgroundColor: C.bg }}><Text style={F.caption}>MISSING</Text><Text style={{ fontSize: 17, fontWeight: '800', color: asg.missing ? C.danger : C.text }}>{asg.missing}</Text></Card>
        </Row>
        <Row gap={8} style={{ marginTop: S.md }}>
          <Btn label="Investigate" variant="ai" size="sm" onPress={investigate} loading={loading} />
          <Btn label="Contact parent" variant="soft" size="sm" onPress={() => router.push(`/teacher/contact-parent?studentId=${student.id}`)} />
          <Btn label="Intervention" variant="outline" size="sm" onPress={() => router.push(`/teacher/interventions?studentId=${student.id}`)} />
        </Row>
      </Card>

      {flags ? (
        <Card style={{ marginTop: S.md, backgroundColor: flags.level === 'urgent' ? C.dangerSoft : C.warningSoft, borderColor: (flags.level === 'urgent' ? C.danger : C.warning) + '55' }}>
          <Row gap={8}>
            <Icon name="alert" size={17} color={flags.level === 'urgent' ? C.danger : C.urgent} />
            <Text style={[F.h3, { color: flags.level === 'urgent' ? C.danger : C.urgent }]}>EARLY-WARNING FLAG — {flags.level.toUpperCase()}</Text>
          </Row>
          <View style={{ marginTop: 6, gap: 4 }}>
            {flags.reasons.map((r, i) => <Text key={i} style={[F.body2, { color: C.text }]}>· {r}</Text>)}
          </View>
          <Text style={[F.body2, { marginTop: 6, color: flags.level === 'urgent' ? C.danger : C.urgent, fontWeight: '700' }]}>Suggested: {flags.suggestion}</Text>
        </Card>
      ) : null}

      <View style={{ marginTop: S.md }}>
        <WhatChangedStrip
          title="WHAT CHANGED"
          items={changes.slice(0, 4).map((c) => ({
            label: c.subjectName, value: `${c.recent}%`, delta: c.delta,
            color: c.color,
          }))}
        />
      </View>

      {aiShown ? (
        <View style={{ marginTop: S.md }}>
          {loading ? (
            <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
              <ActivityIndicator size="large" color={C.ai} />
              <Text style={[F.body2, { marginTop: 10 }]}>Investigating marks, attendance, assignments…</Text>
            </Card>
          ) : null}
          {aiResult ? <AIResultView result={aiResult} source={source} sourceNote={source === 'local' ? 'AI service unreachable — built-in analytics engine used.' : undefined} /> : null}
        </View>
      ) : null}

      <SectionHeader title="Subject performance" />
      <View style={{ gap: 8 }}>
        {strengths.map((s) => {
          const series = subjectSeries(db, student.id, s.subjectId).map((x) => x.pct)
          const t = subjectTrend(db, student.id, s.subjectId)
          return (
            <Card key={s.subjectId} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
              <View style={{ flex: 1 }}>
                <Text style={F.h3}>{s.name}</Text>
                <Text style={[F.caption, { marginTop: 1 }]}>{t.dir}</Text>
              </View>
              <Sparkline data={series} color={s.color} />
              <View style={{ alignItems: 'flex-end', width: 46 }}>
                <Text style={{ fontSize: 14, fontWeight: '800' }}>{Math.round(s.avg)}%</Text>
                {t.delta !== 0 ? <Delta delta={Math.round(t.delta)} suffix="" /> : null}
              </View>
            </Card>
          )
        })}
      </View>

      <SectionHeader title="Assessment history" />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {strengths.flatMap((s) => subjectSeries(db, student.id, s.subjectId)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map((x, i, arr) => {
          const prev = arr[i + 1]
          const delta = prev ? x.pct - prev.pct : 0
          const subj = db.subjects.find((sb) => sb.id === (strengths.find((st) => st.name === x.title.split(' ')[0])?.subjectId ?? ''))
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 13, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
              <View style={{ flex: 1 }}>
                <Text style={[F.h3, { fontSize: 13.5 }]}>{x.title}</Text>
                <Text style={[F.caption, { marginTop: 1 }]}>{formatShort(x.date)}</Text>
              </View>
              <Text style={{ fontWeight: '800' }}>{x.pct}%</Text>
              {delta !== 0 ? <View style={{ marginLeft: 8 }}><Delta delta={delta} suffix="" /></View> : null}
            </View>
          )
        })}
      </Card>

      <SectionHeader title="Pending work" />
      <View style={{ gap: 8 }}>
        {assignments.slice(0, 4).map((s) => (
          <Card key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 8, height: 30, borderRadius: 4, backgroundColor: s.subject.color }} />
            <View style={{ flex: 1 }}>
              <Text style={[F.h3, { fontSize: 13.5 }]}>{s.assignment.title}</Text>
              <Text style={[F.caption, { marginTop: 1 }]}>{s.subject.name} · due {formatHuman(s.assignment.dueDate)}</Text>
            </View>
            {s.status === 'missing' ? <Chip label="MISSING" tone="bad" /> : null}
          </Card>
        ))}
      </View>

      {parentLinks.length ? (
        <View style={{ marginTop: S.md }}>
          <SectionHeader title="Parents" />
          <Card>
            {parentLinks.map((l) => {
              const p = db.parents.find((x) => x.id === l.parentId)
              const pu = p ? userOf(db, p.userId) : null
              if (!pu) return null
              return (
                <TouchableOpacity key={l.id} activeOpacity={0.7} onPress={() => router.push(`/teacher/parent-detail?parentId=${p!.id}`)}>
                  <Row between style={{ paddingVertical: 8 }}>
                    <Row gap={10}>
                      <Avatar name={pu.name} hue={pu.avatarHue ?? 0} size={30} />
                      <View>
                        <Text style={[F.body2, { fontWeight: '700', color: C.primary }]}>{pu.name}</Text>
                        <Text style={[F.mono, { fontSize: 10, color: C.text3 }]}>Linking code: {l.code}</Text>
                      </View>
                    </Row>
                    <Icon name="chevron" size={16} color={C.text3} />
                  </Row>
                </TouchableOpacity>
              )
            })}
          </Card>
        </View>
      ) : null}
    </Screen>
  )
}