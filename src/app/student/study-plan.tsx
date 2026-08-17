import React, { useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Btn, Field, Input, Row, Chip, Segmented } from '@/components/ui'
import { AIResultView } from '@/components/ai-result-view'
import { useAI } from '@/hooks/use-ai'
import { studentByUser, classOf, subjectName, upcomingAssessments } from '@/data/stats'
import { formatHuman } from '@/utils/date'

export default function StudyPlanScreen() {
  const params = useLocalSearchParams<{ mode?: string }>()
  const { db, user } = useStore()
  const { loading, source, run } = useAI()
  const [result, setResult] = useState<Awaited<ReturnType<typeof run>> | null>(null)
  const [mode, setMode] = useState<'plan' | 'whatif'>(params.mode === 'whatif' ? 'whatif' : 'plan')
  const [hours, setHours] = useState('2')
  const [days, setDays] = useState('7')
  const [examSubjectId, setExamSubjectId] = useState<string>('')
  const [started, setStarted] = useState(false)

  const student = studentByUser(db, user?.id ?? '')
  if (!student) return null
  const cls = classOf(db, student.id)!
  const upcoming = upcomingAssessments(db, student.classId).slice(0, 4)

  const generate = async () => {
    setStarted(true)
    setResult(null)
    const r = await run(db, {
      kind: mode === 'plan' ? 'study_plan' : 'what_if',
      params: { studentId: student.id, hoursPerDay: Number(hours) || 2, days: Number(days) || 7, ...(examSubjectId ? { subjectId: examSubjectId } : {}) },
      role: 'student',
    })
    setResult(r)
  }

  return (
    <Screen scroll>
      <Header title={mode === 'plan' ? 'Study plan generator' : 'What-if scenarios'} subtitle={mode === 'plan' ? 'Daily plan built from your data' : 'Estimate possible study allocations'} />
      <Segmented
        options={[{ key: 'plan', label: 'Study plan' }, { key: 'whatif', label: 'What-if' }]}
        value={mode}
        onChange={(m) => { setMode(m); setResult(null); setStarted(false) }}
      />

      <Card style={{ marginTop: S.md }}>
        <Row gap={S.md}>
          <Field label="Hours per day">
            <Input value={hours} onChangeText={setHours} keyboardType="numeric" style={{ minWidth: 80 }} />
          </Field>
          <Field label="Days">
            <Input value={days} onChangeText={setDays} keyboardType="numeric" style={{ minWidth: 80 }} />
          </Field>
        </Row>
        {mode === 'plan' && upcoming.length ? (
          <Field label="Prepare for (optional)">
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              <Chip label="General" tone={!examSubjectId ? 'info' : 'neutral'} onPress={() => setExamSubjectId('')} selected={!examSubjectId} />
              {upcoming.map((a) => (
                <Chip key={a.id} label={`${subjectName(db, a.subjectId)} · ${formatHuman(a.date)}`} tone={examSubjectId === a.subjectId ? 'info' : 'neutral'} onPress={() => setExamSubjectId(a.subjectId)} selected={examSubjectId === a.subjectId} />
              ))}
            </Row>
          </Field>
        ) : null}
        <Btn label={loading ? 'Generating…' : mode === 'plan' ? 'Generate my study plan' : 'Generate scenario'} onPress={generate} loading={loading} variant={mode === 'plan' ? 'primary' : 'warning'} />
        {mode === 'whatif' ? (
          <Text style={[F.caption, { marginTop: 8, lineHeight: 16 }]}>Scenarios project study allocation only. Any expected improvement is an estimate — not a guaranteed outcome.</Text>
        ) : null}
      </Card>

      {loading ? (
        <Card style={{ marginTop: S.md, alignItems: 'center', paddingVertical: 30 }}>
          <ActivityIndicator size="large" color={C.ai} />
          <Text style={[F.body2, { marginTop: 12 }]}>Building your {mode === 'plan' ? 'study plan' : 'scenario'}…</Text>
        </Card>
      ) : null}

      {result ? (
        <View style={{ marginTop: S.md }}>
          <AIResultView result={result} source={source} sourceNote={source === 'local' ? 'AI service unreachable — built-in analytics engine used.' : undefined} />
        </View>
      ) : null}

      {!started && !loading ? (
        <Card style={{ marginTop: S.md, backgroundColor: C.warningSoft, borderColor: C.warning + '44' }}>
          <Text style={[F.h3, { color: C.urgent }]}>How it works</Text>
          <Text style={[F.body2, { marginTop: 6, lineHeight: 19 }]}>
            Your recent marks, attendance and assignment data are summarised into a structured snapshot. The AI turns that into a day-by-day plan for your subjects. {mode === 'whatif' ? 'The what-if tool only estimates time allocation — not outcomes.' : ''}
          </Text>
        </Card>
      ) : null}
    </Screen>
  )
}