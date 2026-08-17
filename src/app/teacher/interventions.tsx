import React, { useState } from 'react'
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, Btn, Field, Input, SectionHeader, Notice, Delta } from '@/components/ui'
import { Icon } from '@/components/icons'
import { AIResultView } from '@/components/ai-result-view'
import { useAI } from '@/hooks/use-ai'
import { teacherOf, interventionImpact, subjectName, className, studentName, allInterventionImpact } from '@/data/stats'
import { addDays, todayISO, formatHuman } from '@/utils/date'

export default function InterventionsScreen() {
  const params = useLocalSearchParams<{ create?: string; classId?: string; studentId?: string }>()
  const { db, user } = useStore()
  const router = useRouter()
  const teacher = teacherOf(db, user?.id ?? '')
  const [mode, setMode] = useState<'list' | 'create'>(params.create ? 'create' : 'list')
  const { loading, source, run } = useAI()
  const [aiResult, setAiResult] = useState<Awaited<ReturnType<typeof run>> | null>(null)
  const [classId, setClassId] = useState(params.classId ?? '')
  const [studentId, setStudentId] = useState(params.studentId ?? '')
  const [subjectId, setSubjectId] = useState('')
  const [topic, setTopic] = useState('')
  const [problem, setProblem] = useState('')
  const [title, setTitle] = useState('')
  const [days, setDays] = useState('3')
  const [publish, setPublish] = useState(false)

  if (!teacher) return null
  const myClasses = db.classes.filter((c) => teacher.classIds.includes(c.id))
  const cls = db.classes.find((c) => c.id === classId)
  const subjects = cls?.subjectIds.map((sid) => db.subjects.find((x) => x.id === sid)!).filter(Boolean) ?? []
  const students = cls ? db.students.filter((s) => s.classId === cls.id) : []
  const myInterventions = db.interventions.filter((i) => i.createdBy === teacher.id || teacher.classIds.includes(i.classId)).sort((a, b) => b.startDate.localeCompare(a.startDate))
  const impacts = allInterventionImpact(db).filter((x) => myInterventions.some((i) => i.id === x.intervention.id))

  const generate = async () => {
    setAiResult(null)
    const r = await run(db, {
      kind: 'intervention',
      params: { subjectId, topic, problem },
      role: 'teacher',
    })
    setAiResult(r)
    setTitle(r?.title ?? '')
  }

  const publishIntervention = () => {
    const end = addDays(todayISO(), Number(days) || 3)
    const iv = api.createIntervention({
      classId, subjectId, studentId: studentId || null,
      title: title || 'Intervention plan',
      problem,
      plan: aiResult?.plan?.map((d) => `${d.label}: ${d.items.map((i) => `${i.subject} ${i.minutes}min — ${i.activity}`).join('; ')}`) ?? aiResult?.sections.flatMap((s) => s.points) ?? [],
      startDate: todayISO(), endDate: end, createdBy: teacher.id,
    })
    // notify the student + parents
    const notifyIds: string[] = []
    if (studentId) {
      const s = db.students.find((x) => x.id === studentId)!
      notifyIds.push(s.userId)
      for (const l of db.parentLinks.filter((l) => l.studentId === studentId)) {
        const p = db.parents.find((x) => x.id === l.parentId)
        if (p) notifyIds.push(p.userId)
      }
    }
    if (notifyIds.length) api.sendNotification(notifyIds, 'Intervention assigned', `${title || 'An intervention plan'} has been created for ${studentId ? studentName(db, studentId) : `${cls?.name} ${cls?.section}`}.`, 'intervention', 'high', '/student/assignments')
    setPublish(true)
    setTimeout(() => { setPublish(false); setMode('list') }, 1200)
  }

  return (
    <Screen scroll>
      <Header
        title="Interventions"
        subtitle="Plan → act → measure impact"
        right={
          <Row gap={6}>
            <Chip label={mode === 'list' ? 'New' : 'List'} tone={mode === 'list' ? 'info' : 'neutral'} onPress={() => { setMode(mode === 'list' ? 'create' : 'list'); setAiResult(null) }} selected={mode === 'create'} />
          </Row>
        }
      />

      {mode === 'list' ? (
        <>
          {impacts.length ? (
            <>
              <SectionHeader title="Measured impact" />
              <View style={{ gap: 8 }}>
                {impacts.map((imp) => (
                  <Card key={imp.intervention.id}>
                    <Row between>
                      <View style={{ flex: 1 }}>
                        <Text style={F.h3}>{imp.intervention.title}</Text>
                        <Text style={[F.caption, { marginTop: 2 }]}>{subjectName(db, imp.intervention.subjectId)} · {imp.intervention.studentId ? studentName(db, imp.intervention.studentId) : className(db, imp.intervention.classId)} · {imp.intervention.status}</Text>
                      </View>
                      <Delta delta={imp.avgDelta} hideZero />
                    </Row>
                    <Row gap={6} style={{ marginTop: S.sm, flexWrap: 'wrap' }}>
                      {imp.results.map((r) => (
                        <Chip key={r.id} label={`${r.beforeScore}% → ${r.afterScore}%`} tone={r.afterScore >= r.beforeScore ? 'good' : 'bad'} />
                      ))}
                      <Chip label={imp.avgDelta >= 0 ? 'POSITIVE OUTCOME' : 'NO IMPROVEMENT'} tone={imp.avgDelta >= 0 ? 'good' : 'bad'} />
                    </Row>
                  </Card>
                ))}
              </View>
            </>
          ) : null}

          <SectionHeader title="All interventions" />
          <View style={{ gap: 8 }}>
            {myInterventions.map((iv) => {
              const imp = interventionImpact(db, iv.id)
              return (
                <Card key={iv.id}>
                  <Row between>
                    <View style={{ flex: 1 }}>
                      <Text style={F.h3}>{iv.title}</Text>
                      <Text style={[F.caption, { marginTop: 2 }]}>{subjectName(db, iv.subjectId)} · {iv.studentId ? studentName(db, iv.studentId) : `${className(db, iv.classId)} (class)`} · {formatHuman(iv.startDate)} → {formatHuman(iv.endDate)}</Text>
                    </View>
                    <Chip label={iv.status} tone={iv.status === 'active' ? 'info' : 'good'} />
                  </Row>
                  <Text style={[F.body2, { marginTop: 6, lineHeight: 17 }]} numberOfLines={2}>{iv.problem}</Text>
                  {imp ? <Row gap={6} style={{ marginTop: 8 }}><Chip label={`impact ${imp.avgDelta >= 0 ? '+' : ''}${imp.avgDelta} pts`} tone={imp.avgDelta >= 0 ? 'good' : 'bad'} /></Row> : null}
                  {iv.status === 'active' ? (
                    <Btn label="Mark completed + record result" variant="soft" size="sm" onPress={() => { api.completeIntervention(iv.id); router.replace('/teacher/interventions') }} style={{ marginTop: S.sm }} />
                  ) : null}
                </Card>
              )
            })}
          </View>
        </>
      ) : (
        <>
          <Card>
            <Text style={[F.caption, { marginBottom: 6 }]}>CLASS</Text>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {myClasses.map((c) => <Chip key={c.id} label={`${c.name} ${c.section}`} tone={classId === c.id ? 'info' : 'neutral'} onPress={() => { setClassId(c.id); setStudentId('') }} selected={classId === c.id} />)}
            </Row>
            {cls ? (
              <>
                <Text style={[F.caption, { marginBottom: 6, marginTop: S.md }]}>SUBJECT</Text>
                <Row gap={8} style={{ flexWrap: 'wrap' }}>
                  {subjects.map((s) => <Chip key={s.id} label={s.name} tone={subjectId === s.id ? 'info' : 'neutral'} onPress={() => setSubjectId(s.id)} selected={subjectId === s.id} />)}
                </Row>
                <Text style={[F.caption, { marginBottom: 6, marginTop: S.md }]}>STUDENT (optional — class-wide if empty)</Text>
                <Row gap={8} style={{ flexWrap: 'wrap' }}>
                  <Chip label="Whole class" tone={!studentId ? 'info' : 'neutral'} onPress={() => setStudentId('')} selected={!studentId} />
                  {students.slice(0, 8).map((s) => (
                    <Chip key={s.id} label={studentName(db, s.id).split(' ')[0]} tone={studentId === s.id ? 'info' : 'neutral'} onPress={() => setStudentId(s.id)} selected={studentId === s.id} />
                  ))}
                </Row>
                <View style={{ marginTop: S.md }}>
                  <Field label="Topic"><Input value={topic} onChangeText={setTopic} placeholder="e.g. Trigonometry" /></Field>
                  <Field label="Problem / what you observed"><Input value={problem} onChangeText={setProblem} placeholder="e.g. 13 students scored below 60% in the last test" multiline /></Field>
                  <Btn label={loading ? 'Generating…' : 'Generate intervention plan'} variant="ai" onPress={generate} loading={loading} />
                </View>
              </>
            ) : <Notice tone="warn">Select a class to continue.</Notice>}
          </Card>

          {loading ? (
            <Card style={{ marginTop: S.md, alignItems: 'center', paddingVertical: 26 }}>
              <ActivityIndicator size="large" color={C.ai} />
              <Text style={[F.body2, { marginTop: 10 }]}>Drafting revision activities and diagnostics…</Text>
            </Card>
          ) : null}

          {aiResult ? (
            <View style={{ marginTop: S.md }}>
              <AIResultView result={aiResult} source={source} sourceNote={source === 'local' ? 'AI service unreachable — built-in analytics engine used.' : undefined} />
              <Card style={{ marginTop: S.md }}>
                <Field label="Final title (edit before publishing)"><Input value={title} onChangeText={setTitle} /></Field>
                <Field label="Duration (days)"><Input value={days} onChangeText={setDays} keyboardType="numeric" style={{ minWidth: 80 }} /></Field>
                <Notice tone="warn">You are about to publish this intervention. Review the plan above before publishing — AI drafts are teacher-approved.</Notice>
                <Btn label="Publish intervention" onPress={publishIntervention} style={{ marginTop: S.md }} />
                {publish ? <Notice tone="success">Intervention published — student and parents notified.</Notice> : null}
              </Card>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  )
}