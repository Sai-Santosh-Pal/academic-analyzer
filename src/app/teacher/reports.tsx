import React, { useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, Btn, Field, Input, Notice, SectionHeader } from '@/components/ui'
import { Icon } from '@/components/icons'
import { AIResultView } from '@/components/ai-result-view'
import { useAI } from '@/hooks/use-ai'
import { teacherOf, className, studentName, recentAssessments, teacherStudents } from '@/data/stats'

export default function TeacherReportsScreen() {
  const params = useLocalSearchParams<{ classId?: string }>()
  const { db, user } = useStore()
  const router = useRouter()
  const { loading, source, run } = useAI()
  const teacher = teacherOf(db, user?.id ?? '')
  const [type, setType] = useState<'class' | 'student' | 'assessment'>('class')
  const [classId, setClassId] = useState(params.classId ?? '')
  const [studentId, setStudentId] = useState('')
  const [assessmentId, setAssessmentId] = useState('')
  const [period, setPeriod] = useState('Term 1 · 2026–27')
  const [result, setResult] = useState<Awaited<ReturnType<typeof run>> | null>(null)

  if (!teacher) return null
  const myClasses = db.classes.filter((c) => teacher.classIds.includes(c.id))
  const students = classId ? teacherStudents(db, teacher.id).filter((s) => s.classId === classId) : []
  const assessments = classId ? recentAssessments(db, classId, undefined, 8) : []
  const myReports = db.reports.filter((r) => r.authorId === user?.id || r.type === 'class')

  const generate = async () => {
    const scopeId = type === 'class' ? classId : type === 'student' ? studentId : assessmentId
    if (!scopeId) return
    const r = await run(db, { kind: 'report', params: { reportType: type, scopeId, period }, role: 'teacher' })
    setResult(r)
    if (r) api.saveReport({ type, title: r.title, scopeId, period, content: JSON.stringify(r), authorId: user!.id })
  }

  return (
    <Screen scroll>
      <Header title="Report center" subtitle="Generate structured academic reports" />

      <Card>
        <Row gap={8}>
          <Chip label="Class report" tone={type === 'class' ? 'info' : 'neutral'} onPress={() => setType('class')} selected={type === 'class'} />
          <Chip label="Student report" tone={type === 'student' ? 'info' : 'neutral'} onPress={() => setType('student')} selected={type === 'student'} />
          <Chip label="Assessment report" tone={type === 'assessment' ? 'info' : 'neutral'} onPress={() => setType('assessment')} selected={type === 'assessment'} />
        </Row>
        <View style={{ marginTop: S.md }}>
          <Text style={[F.caption, { marginBottom: 6 }]}>CLASS</Text>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {myClasses.map((c) => <Chip key={c.id} label={`${c.name} ${c.section}`} tone={classId === c.id ? 'info' : 'neutral'} onPress={() => { setClassId(c.id); setStudentId(''); setAssessmentId(''); setResult(null) }} selected={classId === c.id} />)}
          </Row>
          {type === 'student' && classId ? (
            <>
              <Text style={[F.caption, { marginBottom: 6, marginTop: S.md }]}>STUDENT</Text>
              <Row gap={8} style={{ flexWrap: 'wrap' }}>
                {students.map((s) => <Chip key={s.id} label={studentName(db, s.id).split(' ')[0]} tone={studentId === s.id ? 'info' : 'neutral'} onPress={() => { setStudentId(s.id); setResult(null) }} selected={studentId === s.id} />)}
              </Row>
            </>
          ) : null}
          {type === 'assessment' && classId ? (
            <>
              <Text style={[F.caption, { marginBottom: 6, marginTop: S.md }]}>ASSESSMENT</Text>
              <Row gap={8} style={{ flexWrap: 'wrap' }}>
                {assessments.map((a) => <Chip key={a.id} label={`${a.title} · ${a.date.slice(5)}`} tone={assessmentId === a.id ? 'info' : 'neutral'} onPress={() => { setAssessmentId(a.id); setResult(null) }} selected={assessmentId === a.id} />)}
              </Row>
            </>
          ) : null}
          <Field label="Period"><Input value={period} onChangeText={setPeriod} style={{ marginTop: S.md }} /></Field>
          <Btn label={loading ? 'Generating…' : 'Generate report'} variant="ai" onPress={generate} loading={loading} />
        </View>
      </Card>

      <SectionHeader title="Bulk report cards" />
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="download" size={18} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={F.h3}>Generate class report cards</Text>
          <Text style={[F.caption, { marginTop: 2 }]}>A separate PDF for every student, packaged into a ZIP.</Text>
        </View>
        <Btn label="Generate" variant="soft" size="sm" onPress={() => router.push(`/report-card?classId=${classId || myClasses[0]?.id}&bulk=1`)} />
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

      {myReports.length ? (
        <>
          <SectionHeader title="Previously generated" />
          <View style={{ gap: 8 }}>
            {myReports.slice(0, 5).map((r) => (
              <Card key={r.id}>
                <Text style={[F.h3, { fontSize: 13.5 }]}>{r.title}</Text>
                <Text style={[F.caption, { marginTop: 2 }]}>{r.type} · {r.period}</Text>
              </Card>
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  )
}