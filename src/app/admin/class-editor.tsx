import React, { useState } from 'react'
import { View, Text, TextInput } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, Btn, Notice, SectionHeader, SearchInput } from '@/components/ui'

export default function ClassEditorScreen() {
  const params = useLocalSearchParams<{ classId?: string }>()
  const { db } = useStore()
  const router = useRouter()
  const editing = db.classes.find((c) => c.id === String(params.classId ?? ''))
  const [name, setName] = useState(editing?.name ?? '')
  const [section, setSection] = useState(editing?.section ?? '')
  const [classTeacherId, setClassTeacherId] = useState(editing?.classTeacherId ?? '')
  const [subjectIds, setSubjectIds] = useState<string[]>(editing?.subjectIds ?? [])
  const [q, setQ] = useState('')
  const [customName, setCustomName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const teachers = db.teachers
  const catalog = db.subjects
    .filter((s) => !q.trim() || s.name.toLowerCase().includes(q.trim().toLowerCase()))
    .slice(0, 60)

  const toggleSubject = (id: string) => setSubjectIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const addCustom = () => {
    if (!customName.trim()) return
    const s = api.addSubject(customName)
    if (s && !subjectIds.includes(s.id)) setSubjectIds((prev) => [...prev, s.id])
    setCustomName('')
    setQ('')
  }

  const save = () => {
    setError(null)
    if (!name.trim()) { setError('Class name is required.'); return }
    if (!subjectIds.length) { setError('Pick at least one subject for this class.'); return }
    if (editing) {
      api.updateClass(editing.id, {
        name: name.trim(), section: section.trim() || 'A', classTeacherId,
        subjectIds,
      })
      router.back()
    } else {
      const c = api.createClass({
        name: name.trim(), section: section.trim() || 'A', academicYear: '2026–27',
        classTeacherId, subjectIds,
      })
      router.replace(`/admin/class-detail?classId=${c.id}`)
    }
  }

  return (
    <Screen scroll>
      <Header title={editing ? `Edit ${editing.name} ${editing.section}` : 'New class'} subtitle={editing ? 'Name, class teacher & subjects' : 'Name, class teacher & subjects'} />

      <Card>
        <TextInput value={name} onChangeText={setName} placeholder="Class name (e.g. XI)" placeholderTextColor={C.text3} style={styles.input} />
        <TextInput value={section} onChangeText={setSection} placeholder="Section (e.g. A)" placeholderTextColor={C.text3} style={styles.input} />
      </Card>

      <SectionHeader title="Class teacher" />
      <Card>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          <Chip label="— None —" tone={!classTeacherId ? 'neutral' : 'info'} onPress={() => setClassTeacherId('')} selected={!classTeacherId} />
          {teachers.map((t) => {
            const u = db.users.find((x) => x.id === t.userId)
            return (
              <Chip key={t.id} label={u?.name ?? t.id} tone={classTeacherId === t.id ? 'good' : 'neutral'} onPress={() => setClassTeacherId(t.id)} selected={classTeacherId === t.id} />
            )
          })}
          {!teachers.length ? <Text style={F.caption}>No teachers yet — add one from People → Add teacher.</Text> : null}
        </Row>
      </Card>

      <SectionHeader title={`Subjects — ${subjectIds.length} selected`} />
      <Card>
        <SearchInput value={q} onChange={setQ} placeholder="Search subjects (e.g. Hindi, EVS)…" />
        <Row gap={8} style={{ flexWrap: 'wrap', marginTop: S.sm }}>
          {catalog.map((s) => (
            <Chip key={s.id} label={s.name} tone={subjectIds.includes(s.id) ? 'info' : 'neutral'} onPress={() => toggleSubject(s.id)} selected={subjectIds.includes(s.id)} />
          ))}
        </Row>
      </Card>

      <SectionHeader title="Add a custom subject" />
      <Card>
        <Row gap={8}>
          <TextInput
            value={customName}
            onChangeText={setCustomName}
            placeholder="e.g. EVS, Hindi, Robotics…"
            placeholderTextColor={C.text3}
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
          />
          <Btn label="Add" size="sm" onPress={addCustom} disabled={!customName.trim()} />
        </Row>
        <Text style={[F.caption, { marginTop: S.sm }]}>
          Custom subjects join the school catalog and are available to every class.
        </Text>
      </Card>

      {error ? <Text style={{ color: C.danger, fontWeight: '700', fontSize: 12.5, marginTop: S.md }}>{error}</Text> : null}
      <Btn label={editing ? 'Save changes' : 'Create class'} onPress={save} style={{ marginTop: S.md }} />
      {editing ? (
        <Btn label="Timetable for this class" variant="soft" onPress={() => router.push(`/admin/class-timetable?classId=${editing.id}`)} style={{ marginTop: S.sm }} />
      ) : null}
      {!editing ? (
        <View style={{ marginTop: S.md }}>
          <Notice tone="info">After creating the class you can build its timetable — manually or with AI.</Notice>
        </View>
      ) : null}
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