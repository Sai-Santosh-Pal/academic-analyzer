import React, { useState } from 'react'
import { View, Text, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore, api, store } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Btn, Row, Chip, Notice, SectionHeader } from '@/components/ui'

export default function AddStudentScreen() {
  const { db } = useStore()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [classId, setClassId] = useState('')
  const [parentId, setParentId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cloudMode = store.isCloudMode
  const parents = db.users.filter((u) => u.role === 'parent')

  const submit = async () => {
    setError(null)
    if (!name.trim() || !email.includes('@') || password.length < 6) { setError('Fill name, a valid email and a password of at least 6 characters.'); return }
    if (!classId) { setError('Pick the student\'s class.'); return }
    setBusy(true)
    try {
      const res = await api.createStudentAccount({ name, email, password, classId, ...(parentId ? { parentId } : {}) })
      if (!res.ok) { setError(res.message); return }
      router.back()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen scroll>
      <Header title="Add student" subtitle="Teacher → student" />
      {!cloudMode ? (
        <Notice tone="warn">Sign in with your teacher (Firebase) account first — real student accounts can only be created from cloud mode.</Notice>
      ) : null}
      <Card>
        <Text style={[F.body2, { lineHeight: 20 }]}>
          The student gets their own email and password to sign in. If you link a parent, the parent sees them under their children; otherwise the parent can link the student later with the linking code.
        </Text>
        <TextInput value={name} onChangeText={setName} placeholder="Student name" placeholderTextColor={C.text3} style={styles.input} />
        <TextInput value={email} onChangeText={setEmail} placeholder="Email (their sign-in)" placeholderTextColor={C.text3} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Temporary password (min 6 chars)" placeholderTextColor={C.text3} secureTextEntry style={styles.input} />
      </Card>

      <SectionHeader title="Class" />
      <Card>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {db.classes.map((c) => (
            <Chip key={c.id} label={`${c.name} ${c.section}`} tone={classId === c.id ? 'info' : 'neutral'} onPress={() => setClassId(c.id)} selected={classId === c.id} />
          ))}
          {!db.classes.length ? <Text style={F.caption}>No classes on record yet — create one first.</Text> : null}
        </Row>
      </Card>

      <SectionHeader title="Parent (optional)" />
      <Card>
        {parents.length ? (
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            <Chip label="No parent yet" tone={parentId === '' ? 'info' : 'neutral'} onPress={() => setParentId('')} selected={parentId === ''} />
            {parents.map((p) => (
              <Chip key={p.id} label={p.name} tone={parentId === p.id ? 'info' : 'neutral'} onPress={() => setParentId(p.id)} selected={parentId === p.id} />
            ))}
          </Row>
        ) : (
          <Text style={F.caption}>No parents registered yet — skip this; the parent can link the student later with a linking code.</Text>
        )}
        {parentId ? <Text style={[F.caption, { marginTop: S.sm }]}>The student will appear under {parents.find((p) => p.id === parentId)?.name}'s children.</Text> : null}
      </Card>

      {error ? <Text style={{ color: C.danger, fontWeight: '700', fontSize: 12.5, marginTop: S.md }}>{error}</Text> : null}

      <Btn label={busy ? 'Creating account…' : 'Add student'} onPress={submit} disabled={busy} style={{ marginTop: S.md, marginBottom: 32 }} />
    </Screen>
  )
}

const styles = {
  input: { borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, backgroundColor: '#fff', marginBottom: 10, color: C.text } as const,
}