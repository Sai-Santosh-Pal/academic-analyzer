import React, { useState } from 'react'
import { View, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, Btn, Field, Input, Notice, Avatar } from '@/components/ui'
import { Icon } from '@/components/icons'
import { teacherOf, className, studentName, linkedChildren, userOf } from '@/data/stats'

export default function NotifyScreen() {
  const params = useLocalSearchParams<{ classId?: string; studentId?: string }>()
  const { db, user } = useStore()
  const router = useRouter()
  const teacher = teacherOf(db, user?.id ?? '')
  const [classId, setClassId] = useState(params.classId ?? '')
  const [scope, setScope] = useState<'class' | 'students' | 'parents'>('class')
  const [selectedStudents, setSelectedStudents] = useState<string[]>(params.studentId ? [String(params.studentId)] : [])
  const [title, setTitle] = useState('Class announcement')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [sent, setSent] = useState(false)

  if (!teacher) return null
  const myClasses = db.classes.filter((c) => teacher.classIds.includes(c.id))
  const cls = db.classes.find((c) => c.id === classId)
  const students = cls ? db.students.filter((s) => s.classId === cls.id) : []

  const recipients = (): string[] => {
    const ids: string[] = []
    const targetStudents = scope === 'class' ? students : students.filter((s) => selectedStudents.includes(s.id))
    for (const s of targetStudents) {
      if (scope === 'parents') {
        for (const l of db.parentLinks.filter((l) => l.studentId === s.id)) {
          const p = db.parents.find((x) => x.id === l.parentId)
          if (p) ids.push(p.userId)
        }
      } else {
        ids.push(s.userId)
      }
    }
    return ids
  }

  const send = () => {
    const ids = recipients()
    api.sendNotification(ids, title, body, 'announcement', priority)
    setSent(true)
    setTimeout(() => { setSent(false); router.back() }, 1500)
  }

  return (
    <Screen scroll>
      <Header title="Send notification" subtitle="To class, selected students or parents" />
      <Card>
        <Text style={[F.caption, { marginBottom: 6 }]}>CLASS</Text>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {myClasses.map((c) => <Chip key={c.id} label={`${c.name} ${c.section}`} tone={classId === c.id ? 'info' : 'neutral'} onPress={() => setClassId(c.id)} selected={classId === c.id} />)}
        </Row>
        <Text style={[F.caption, { marginBottom: 6, marginTop: S.md }]}>RECIPIENTS</Text>
        <Row gap={8}>
          {([['class', 'Entire class'], ['students', 'Selected students'], ['parents', 'Parents']] as const).map(([k, label]) => (
            <Chip key={k} label={label} tone={scope === k ? 'info' : 'neutral'} onPress={() => setScope(k)} selected={scope === k} />
          ))}
        </Row>
        {scope !== 'class' && cls ? (
          <View style={{ marginTop: S.md, maxHeight: 260 }}>
            {students.map((s) => {
              const u = userOf(db, s.userId)!
              const sel = selectedStudents.includes(s.id)
              return (
                <Row key={s.id} between style={{ paddingVertical: 5 }}>
                  <Row gap={8}>
                    <Avatar name={u.name} hue={u.avatarHue} size={26} />
                    <Text style={[F.body, { fontSize: 13 }]}>{u.name}</Text>
                  </Row>
                  <Chip label={sel ? 'Selected' : 'Select'} tone={sel ? 'info' : 'neutral'} onPress={() => setSelectedStudents((prev) => sel ? prev.filter((x) => x !== s.id) : [...prev, s.id])} selected={sel} />
                </Row>
              )
            })}
          </View>
        ) : null}
        <View style={{ marginTop: S.md }}>
          <Field label="Title"><Input value={title} onChangeText={setTitle} placeholder="e.g. Physics Test Reminder" /></Field>
          <Field label="Message"><Input value={body} onChangeText={setBody} placeholder="e.g. Physics Unit Test is scheduled for Friday. Please revise Chapters 3 and 4." multiline /></Field>
          <Field label="Priority">
            <Row gap={8}>
              {(['low', 'medium', 'high'] as const).map((p) => <Chip key={p} label={p} tone={p === 'high' ? 'bad' : p === 'medium' ? 'warn' : 'good'} onPress={() => setPriority(p)} selected={priority === p} />)}
            </Row>
          </Field>
        </View>
      </Card>

      {sent ? <Notice tone="success" >Notification sent to {recipients().length} recipients.</Notice> : null}
      <Btn label={`Send to ${recipients().length} recipient(s)`} onPress={send} style={{ marginTop: S.md }} disabled={!body.trim() || !classId} />
    </Screen>
  )
}