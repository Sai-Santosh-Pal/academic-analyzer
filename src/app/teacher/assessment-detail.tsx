import React, { useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, SectionHeader, Btn, EmptyState, Notice } from '@/components/ui'
import { Icon } from '@/components/icons'
import { DonutChart, Legend, BarChart } from '@/components/charts'
import { AIResultView } from '@/components/ai-result-view'
import { useAI } from '@/hooks/use-ai'
import { assessmentClassStats, subjectName, className, studentName } from '@/data/stats'
import { formatHuman } from '@/utils/date'

export default function AssessmentDetailScreen() {
  const params = useLocalSearchParams<{ assessmentId: string }>()
  const { db, user } = useStore()
  const router = useRouter()
  const { loading, source, run } = useAI()
  const [aiResult, setAiResult] = useState<Awaited<ReturnType<typeof run>> | null>(null)

  const asm = db.assessments.find((a) => a.id === String(params.assessmentId))
  if (!asm) return <Screen><Header title="Assessment" /><Text>Not found</Text></Screen>

  const stats = assessmentClassStats(db, asm.id)
  const marks = db.marks.filter((m) => m.assessmentId === asm.id).sort((a, b) => b.score - a.score)
  const markedCount = marks.length

  const analyze = async () => {
    const r = await run(db, { kind: 'assessment_analysis', params: { assessmentId: asm.id }, role: 'teacher' })
    setAiResult(r)
  }

  return (
    <Screen scroll>
      <Header title={`${subjectName(db, asm.subjectId)} · ${asm.title}`} subtitle={`${className(db, asm.classId)} · ${formatHuman(asm.date)} · ${asm.maxMarks} marks`} />

      {asm.status === 'scheduled' ? (
        <Card style={{ backgroundColor: C.warningSoft, borderColor: C.warning + '44' }}>
          <Row between>
            <Text style={[F.h3, { color: C.urgent }]}>Marks not entered yet</Text>
            <Btn label="Enter marks" variant="warning" size="sm" onPress={() => router.push(`/teacher/enter-marks?assessmentId=${asm.id}`)} />
          </Row>
        </Card>
      ) : null}

      {stats ? (
        <>
          <Row gap={S.md} style={{ marginTop: S.md }}>
            <Card style={{ flex: 1, alignItems: 'center', paddingVertical: S.lg }}>
              <Text style={[F.micro, { color: C.text3 }]}>CLASS AVG</Text>
              <Text style={{ fontSize: 26, fontWeight: '900', letterSpacing: -0.5 }}>{stats.avg}%</Text>
              <Text style={F.caption}>median {stats.median}%</Text>
            </Card>
            <Card style={{ flex: 1, alignItems: 'center', paddingVertical: S.lg }}>
              <Text style={[F.micro, { color: C.text3 }]}>HIGH / LOW</Text>
              <Text style={{ fontSize: 26, fontWeight: '900', letterSpacing: -0.5, color: C.success }}>{stats.max}%</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: C.danger }}>{stats.min}%</Text>
            </Card>
          </Row>

          <SectionHeader title="Score distribution" />
          <Card>
            <BarChart
              data={[
                { label: '<40', value: stats.buckets[0], color: C.danger },
                { label: '40-55', value: stats.buckets[1], color: C.warning },
                { label: '55-70', value: stats.buckets[2], color: C.accent },
                { label: '70-85', value: stats.buckets[3], color: C.primary },
                { label: '85+', value: stats.buckets[4], color: C.success },
              ]}
              height={150}
            />
            <Text style={[F.caption, { marginTop: 4 }]}>{markedCount} students marked</Text>
          </Card>

          <SectionHeader title="Top scores" />
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {marks.slice(0, 8).map((m, i, arr) => {
              const p = (m.score / asm.maxMarks) * 100
              const below = p < 55
              return (
                <Row key={m.id} between style={{ padding: 12, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: C.border, backgroundColor: below ? C.dangerSoft + '88' : 'transparent' }}>
                  <Row gap={10}>
                    <Text style={[F.caption, { width: 24 }]}>{i + 1}</Text>
                    <Text style={[F.body, { fontWeight: '600' }]}>{studentName(db, m.studentId)}</Text>
                    {below ? <Chip label="SUPPORT" tone="bad" /> : null}
                  </Row>
                  <Text style={{ fontWeight: '800', color: below ? C.danger : C.text }}>{m.score}/{asm.maxMarks} · {Math.round(p)}%</Text>
                </Row>
              )
            })}
          </Card>
        </>
      ) : null}

      <SectionHeader title="AI assessment analysis" />
      <Card style={{ backgroundColor: C.aiSoft, borderColor: C.ai + '33' }}>
        <Text style={[F.body2, { lineHeight: 19 }]}>Detect common weaknesses and students requiring additional support from the results.</Text>
        <Btn label={loading ? 'Analysing…' : 'Analyse results'} variant="ai" onPress={analyze} loading={loading} style={{ marginTop: S.md }} />
      </Card>
      {loading ? (
        <Card style={{ marginTop: S.md, alignItems: 'center', paddingVertical: 26 }}>
          <ActivityIndicator size="large" color={C.ai} />
        </Card>
      ) : null}
      {aiResult ? (
        <View style={{ marginTop: S.md }}>
          <AIResultView result={aiResult} source={source} sourceNote={source === 'local' ? 'AI service unreachable — built-in analytics engine used.' : undefined} />
        </View>
      ) : null}

      <Btn label="Edit marks" variant="outline" onPress={() => router.push(`/teacher/enter-marks?assessmentId=${asm.id}`)} style={{ marginTop: S.md }} />
    </Screen>
  )
}