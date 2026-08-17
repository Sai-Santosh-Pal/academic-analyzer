import React, { useState } from 'react'
import { View, Text, TextInput } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, Btn, SectionHeader } from '@/components/ui'

export default function EditTeacherScreen() {
  const params = useLocalSearchParams<{ teacherId: string }>()
  const { db } = useStore()
  const router = useRouter()
  const teacher = db.teachers.find((t) => t.id === String(params.teacherId))
  const user = teacher ? db.users.find((u) => u.id === teacher.userId) : null
  const [name, setName] = useState(user?.name ?? '')
  const [subjectIds, setSubjectIds] = useState<string[]>(teacher?.subjectIds ?? [])
  const [classTeacherOfIds, setClassTeacherOfIds] = useState<string[]>(teacher?.classTeacherOfIds ?? [])
  const [customSubject, setCustomSubject] = useState('')
  const [customError, setCustomError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!teacher || !user) return <Screen><Header title="Edit teacher" /><Text style={{ padding: S.lg }}>Teacher not found.</Text></Screen>

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  const addCustomSubject = () => {
    setCustomError(null)
    const s = api.addSubject(customSubject)
    if (!s) { setCustomError('Type a subject name first.'); return }
    setCustomSubject('')
    if (!subjectIds.includes(s.id)) setSubjectIds([...subjectIds, s.id])
  }

  const save = () => {
    setError(null)
    if (!name.trim()) { setError('Name is required.'); return }
    api.updateTeacher(teacher.id, {
      name: name.trim(),
      subjectIds,
      classTeacherOfIds,
    })
    router.back()
  }

  return (
    <Screen scroll>
      <Header title="Edit teacher" subtitle={user.email} />

      <Card>
        <TextInput value={name} onChangeText={setName} placeholder="Teacher name" placeholderTextColor={C.text3} style={styles.input} />
        <Row between>
          <Text style={[F.caption, { flex: 1 }]}>Sign-in email (cannot be changed here)</Text>
          <Text style={[F.caption, { color: C.text2 }]}>{user.email}</Text>
        </Row>
      </Card>

      <SectionHeader title="Teaches subjects" />
      <Card>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {db.subjects.map((s) => (
            <Chip key={s.id} label={s.name} tone={subjectIds.includes(s.id) ? 'info' : 'neutral'} onPress={() => toggle(subjectIds, setSubjectIds, s.id)} selected={subjectIds.includes(s.id)} />
          ))}
        </Row>
        <Row gap={8} style={{ marginTop: S.sm }}>
          <TextInput value={customSubject} onChangeText={setCustomSubject} placeholder="Add a custom subject, e.g. Robotics" placeholderTextColor={C.text3} style={[styles.input, { flex: 1, marginBottom: 0 }]} />
          <Btn label="Add" variant="soft" onPress={addCustomSubject} />
        </Row>
        {customError ? <Text style={{ color: C.danger, fontWeight: '700', fontSize: 12.5, marginTop: 6 }}>{customError}</Text> : null}
      </Card>

      <SectionHeader title="Class teacher of (optional)" />
      <Card>
        <Text style={[F.caption, { marginBottom: 8, lineHeight: 17 }]}>
          Only class teachers can mark attendance. The classes this teacher teaches are set automatically when a timetable is generated for them.
        </Text>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {db.classes.map((c) => (
            <Chip key={c.id} label={`${c.name} ${c.section}`} tone={classTeacherOfIds.includes(c.id) ? 'good' : 'neutral'} onPress={() => toggle(classTeacherOfIds, setClassTeacherOfIds, c.id)} selected={classTeacherOfIds.includes(c.id)} />
          ))}
          {!db.classes.length ? <Text style={F.caption}>No classes yet — create one in the Classes tab.</Text> : null}
        </Row>
      </Card>

      {error ? <Text style={{ color: C.danger, fontWeight: '700', fontSize: 12.5, marginTop: S.md }}>{error}</Text> : null}
      <Btn label="Save changes" onPress={save} style={{ marginTop: S.md }} />
    </Screen>
  )
}

const styles = {
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: S.md,
    backgroundColor: '#fff',
  },
}