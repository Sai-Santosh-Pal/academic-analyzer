import React, { useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Btn, Field, Input, Row, Chip, Notice } from '@/components/ui'
import { AIResultView } from '@/components/ai-result-view'
import { useAI } from '@/hooks/use-ai'
import { teacherOf } from '@/data/stats'

export default function LessonPlannerScreen() {
  const { db, user } = useStore()
  const { loading, source, run } = useAI()
  const [subjectId, setSubjectId] = useState('')
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState('45')
  const [result, setResult] = useState<Awaited<ReturnType<typeof run>> | null>(null)

  const teacher = teacherOf(db, user?.id ?? '')
  if (!teacher) return null
  const mySubjects = teacher.subjectIds.map((sid) => db.subjects.find((x) => x.id === sid)!).filter(Boolean)

  const generate = async () => {
    const r = await run(db, { kind: 'lesson_plan', params: { subjectId, topic, duration: Number(duration) || 45 }, role: 'teacher' })
    setResult(r)
  }

  return (
    <Screen scroll>
      <Header title="AI lesson planner" subtitle="Objectives → structure → activities → assessment" />
      <Card>
        <Field label="Subject">
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {mySubjects.map((s) => <Chip key={s.id} label={s.name} tone={subjectId === s.id ? 'info' : 'neutral'} onPress={() => setSubjectId(s.id)} selected={subjectId === s.id} />)}
          </Row>
        </Field>
        <Field label="Topic"><Input value={topic} onChangeText={setTopic} placeholder="e.g. Newton's Laws of Motion" /></Field>
        <Field label="Duration (minutes)"><Input value={duration} onChangeText={setDuration} keyboardType="numeric" style={{ minWidth: 90 }} /></Field>
        <Btn label={loading ? 'Planning…' : 'Generate lesson plan'} variant="ai" onPress={generate} loading={loading} />
        <Notice tone="info" >You can edit the plan after generation before saving.</Notice>
      </Card>

      {loading ? (
        <Card style={{ marginTop: S.md, alignItems: 'center', paddingVertical: 26 }}>
          <ActivityIndicator size="large" color={C.ai} />
        </Card>
      ) : null}
      {result ? (
        <View style={{ marginTop: S.md }}>
          <AIResultView result={result} source={source} sourceNote={source === 'local' ? 'AI service unreachable — built-in analytics engine used.' : undefined} />
          <Btn label="Save lesson plan" variant="soft" style={{ marginTop: S.md }} onPress={() => {}} />
        </View>
      ) : null}
    </Screen>
  )
}