import React, { useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Btn, Row, Chip } from '@/components/ui'
import { AIResultView } from '@/components/ai-result-view'
import { useAI } from '@/hooks/use-ai'
import { teacherOf, className, recentAssessments } from '@/data/stats'

export default function TeacherAIToolsScreen() {
  const params = useLocalSearchParams<{ tool?: string; classId?: string }>()
  const { db, user } = useStore()
  const { loading, source, run } = useAI()
  const [result, setResult] = useState<Awaited<ReturnType<typeof run>> | null>(null)
  const teacher = teacherOf(db, user?.id ?? '')

  if (!teacher) return null
  const myClasses = db.classes.filter((c) => teacher.classIds.includes(c.id))
  const classId = params.classId ?? myClasses[0]?.id ?? ''
  const [selectedClass, setSelectedClass] = useState(classId)
  const [selectedAssessment, setSelectedAssessment] = useState('')

  const tool = params.tool ?? 'class'
  const assessments = selectedClass ? recentAssessments(db, selectedClass, undefined, 8) : []

  const generate = async () => {
    setResult(null)
    if (tool === 'class') {
      const r = await run(db, { kind: 'class_analysis', params: { classId: selectedClass }, role: 'teacher' })
      setResult(r)
    } else if (tool === 'assessment' && selectedAssessment) {
      const r = await run(db, { kind: 'assessment_analysis', params: { assessmentId: selectedAssessment }, role: 'teacher' })
      setResult(r)
    }
  }

  return (
    <Screen scroll>
      <Header title={tool === 'class' ? 'AI class analysis' : 'AI assessment analysis'} />

      <Card>
        <Text style={[F.caption, { marginBottom: 6 }]}>CLASS</Text>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {myClasses.map((c) => <Chip key={c.id} label={`${c.name} ${c.section}`} tone={selectedClass === c.id ? 'info' : 'neutral'} onPress={() => { setSelectedClass(c.id); setSelectedAssessment(''); setResult(null) }} selected={selectedClass === c.id} />)}
        </Row>
        {tool === 'assessment' ? (
          <>
            <Text style={[F.caption, { marginBottom: 6, marginTop: S.md }]}>ASSESSMENT</Text>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {assessments.map((a) => <Chip key={a.id} label={`${a.title} · ${a.date.slice(5)}`} tone={selectedAssessment === a.id ? 'info' : 'neutral'} onPress={() => { setSelectedAssessment(a.id); setResult(null) }} selected={selectedAssessment === a.id} />)}
            </Row>
          </>
        ) : null}
        <Btn label={loading ? 'Analysing…' : 'Generate analysis'} variant="ai" onPress={generate} loading={loading} style={{ marginTop: S.md }} disabled={tool === 'assessment' && !selectedAssessment} />
      </Card>

      {loading ? (
        <Card style={{ marginTop: S.md, alignItems: 'center', paddingVertical: 26 }}>
          <ActivityIndicator size="large" color={C.ai} />
          <Text style={[F.body2, { marginTop: 10 }]}>Analysing class-wide patterns…</Text>
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