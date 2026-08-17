import React, { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, Avatar, Btn, Field, Input, Notice, Sheet } from '@/components/ui'
import { teacherOf, subjectName, className } from '@/data/stats'
import { todayISO } from '@/utils/date'

export default function EnterMarksScreen() {
  const params = useLocalSearchParams<{ assessmentId?: string; classId?: string }>()
  const { db, user } = useStore()
  const router = useRouter()
  const teacher = teacherOf(db, user?.id ?? '')
  const [classId, setClassId] = useState(params.classId ?? '')
  const [subjectId, setSubjectId] = useState('')
  const [title, setTitle] = useState('Unit Test 5')
  const [date, setDate] = useState(todayISO())
  const [maxMarks, setMaxMarks] = useState('40')
  const [scores, setScores] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [createSheet, setCreateSheet] = useState(false)

  if (!teacher) return null
  const myClasses = db.classes.filter((c) => teacher.classIds.includes(c.id))
  const existing = params.assessmentId ? db.assessments.find((a) => a.id === params.assessmentId) : null
  const cls = db.classes.find((c) => c.id === (existing?.classId ?? classId))
  const subjects = cls?.subjectIds.map((sid) => db.subjects.find((x) => x.id === sid)!).filter(Boolean) ?? []
  const activeSubject = existing?.subjectId ?? subjectId ?? subjects[0]?.id ?? ''
  const students = cls ? db.students.filter((s) => s.classId === cls.id) : []

  React.useEffect(() => {
    if (existing) {
      const next: Record<string, string> = {}
      for (const m of db.marks.filter((m) => m.assessmentId === existing.id)) next[m.studentId] = String(m.score)
      setScores(next)
    }
  }, [existing?.id])

  const save = () => {
    if (existing) {
      api.saveMarks(
        students.map((s) => ({ assessmentId: existing.id, studentId: s.id, score: Number(scores[s.id]) || 0 })),
        teacher.id
      )
      setSaved(true)
      setTimeout(() => { setSaved(false); router.back() }, 1500)
      return
    }
    setCreateSheet(true)
  }

  const createAndSave = () => {
    const a = api.createAssessment({
      classId, subjectId: activeSubject, teacherId: teacher.id, title,
      date, maxMarks: Number(maxMarks) || 40, term: 'Term 1', status: 'scheduled',
    })
    api.saveMarks(students.map((s) => ({ assessmentId: a.id, studentId: s.id, score: Number(scores[s.id]) || 0 })), teacher.id)
    setCreateSheet(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const marked = Object.values(scores).filter((s) => s !== '').length

  return (
    <Screen scroll>
      <Header title={existing ? 'Edit marks' : 'Assessment & marks'} subtitle={existing ? `${subjectName(db, existing.subjectId)} · ${existing.title}` : 'Create an assessment and enter marks'} />

      {!existing ? (
        <Card>
          <Text style={[F.caption, { marginBottom: 6 }]}>CLASS</Text>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {myClasses.map((c) => <Chip key={c.id} label={`${c.name} ${c.section}`} tone={classId === c.id ? 'info' : 'neutral'} onPress={() => { setClassId(c.id); setScores({}) }} selected={classId === c.id} />)}
          </Row>
          {cls ? (
            <>
              <Text style={[F.caption, { marginBottom: 6, marginTop: S.md }]}>SUBJECT</Text>
              <Row gap={8} style={{ flexWrap: 'wrap' }}>
                {subjects.map((s) => <Chip key={s.id} label={s.name} tone={activeSubject === s.id ? 'info' : 'neutral'} onPress={() => setSubjectId(s.id)} selected={activeSubject === s.id} />)}
              </Row>
              <Row gap={S.md} style={{ marginTop: S.md }}>
                <Field label="Title"><Input value={title} onChangeText={setTitle} style={{ minWidth: 130 }} /></Field>
                <Field label="Date"><Input value={date} onChangeText={setDate} /></Field>
                <Field label="Max marks"><Input value={maxMarks} onChangeText={setMaxMarks} keyboardType="numeric" style={{ minWidth: 70 }} /></Field>
              </Row>
            </>
          ) : null}
        </Card>
      ) : null}

      {cls ? (
        <>
          <Card style={{ marginTop: S.md }}>
            <Row between style={{ marginBottom: S.sm }}>
              <Text style={F.h3}>{students.length} students</Text>
              <Chip label={`${marked}/${students.length} entered`} tone={marked === students.length ? 'good' : 'warn'} />
            </Row>
            {students.map((s) => {
              const u = db.users.find((x) => x.id === s.userId)!
              const max = existing?.maxMarks ?? (Number(maxMarks) || 40)
              const val = Number(scores[s.id])
              const p = val / (max || 1) * 100
              return (
                <Row key={s.id} between style={{ paddingVertical: 6 }}>
                  <Row gap={10} style={{ flex: 1 }}>
                    <Avatar name={u.name} hue={u.avatarHue} size={28} />
                    <Text style={[F.body, { fontWeight: '600', fontSize: 13 }]} numberOfLines={1}>{u.name}</Text>
                  </Row>
                  <TouchableOpacity
                    onPress={() => setScores((prev) => ({ ...prev, [s.id]: String(Math.min(max, (val + 1) % (max + 1))) }))}
                    style={{ backgroundColor: C.bg, borderRadius: 10, borderWidth: 1.5, borderColor: p >= 60 ? C.success + '66' : C.border, paddingHorizontal: 10, paddingVertical: 6, minWidth: 76 }}
                  >
                    <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 14, color: scores[s.id] === '' ? C.text3 : p >= 60 ? C.success : C.danger }}>
                      {scores[s.id] === '' || scores[s.id] === undefined ? '−' : scores[s.id]}
                    </Text>
                  </TouchableOpacity>
                </Row>
              )
            })}
            <Text style={[F.caption, { marginTop: 6 }]}>Tap a score to cycle. Assignments are auto-graded at 100%.</Text>
          </Card>

          {saved ? <Notice tone="success" >Marks saved — percentages, class average and trends recalculated automatically.</Notice> : null}
          <Btn label="Save marks" onPress={save} style={{ marginTop: S.md }} />

          <Sheet visible={createSheet} onClose={() => setCreateSheet(false)} title="Create assessment">
            <Text style={[F.body2, { lineHeight: 19 }]}>This creates a new assessment ({title}, {maxMarks} marks) for {cls.name} {cls.section} — {subjectName(db, activeSubject)} and saves the entered marks in one step.</Text>
            <Btn label="Create & save marks" onPress={createAndSave} style={{ marginTop: S.md }} />
          </Sheet>
        </>
      ) : (
        <Card style={{ marginTop: S.md }}><Text style={F.body2}>Select a class first.</Text></Card>
      )}
    </Screen>
  )
}