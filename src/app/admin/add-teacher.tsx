import React, { useState } from 'react'
import { View, Text, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore, api, store } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Btn, Row, Chip, Notice, SectionHeader } from '@/components/ui'

export default function AddTeacherScreen() {
  const { db } = useStore()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [subjectIds, setSubjectIds] = useState<string[]>([])
  const [classTeacherOfIds, setClassTeacherOfIds] = useState<string[]>([])
  const [customSubject, setCustomSubject] = useState('')
  const [customError, setCustomError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cloudMode = store.isCloudMode

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  const addCustomSubject = () => {
    setCustomError(null)
    const s = api.addSubject(customSubject)
    if (!s) { setCustomError('Type a subject name first.'); return }
    setCustomSubject('')
    if (!subjectIds.includes(s.id)) setSubjectIds([...subjectIds, s.id])
  }

  const submit = async () => {
    setError(null)
    if (!name.trim() || !email.includes('@') || password.length < 6) { setError('Fill name, a valid email and a password of at least 6 characters.'); return }
    setBusy(true)
    try {
      const res = await api.createTeacherAccount({ name, email, password, subjectIds, classTeacherOfIds })
      if (!res.ok) { setError(res.message); return }
      router.back()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen scroll>
      <Header title="Add teacher" subtitle="School → teacher" />
      {!cloudMode ? (
        <Notice tone="warn">Sign in with your school (Firebase) account first — real teacher accounts can only be created from cloud mode.</Notice>
      ) : null}
      <Card>
        <TextInput value={name} onChangeText={setName} placeholder="Teacher name" placeholderTextColor={C.text3} style={styles.input} />
        <TextInput value={email} onChangeText={setEmail} placeholder="Email (their sign-in)" placeholderTextColor={C.text3} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Temporary password (min 6 chars)" placeholderTextColor={C.text3} secureTextEntry style={styles.input} />
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
          {!db.classes.length ? <Text style={F.caption}>No classes yet — create one in the Classes tab first.</Text> : null}
        </Row>
      </Card>

      {error ? <Text style={{ color: C.danger, fontWeight: '700', fontSize: 12.5, marginTop: S.md }}>{error}</Text> : null}
      <Btn label={busy ? 'Creating account…' : 'Create teacher account'} onPress={submit} loading={busy} disabled={!cloudMode} style={{ marginTop: S.md }} />
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