import React, { useState } from 'react'
import { View, Text, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore, api, store } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Btn, Row, Chip, Notice, SectionHeader } from '@/components/ui'

export default function AddWardScreen() {
  const { db, user } = useStore()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [classId, setClassId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cloudMode = store.isCloudMode
  const parentId = user?.id ?? ''

  const submit = async () => {
    setError(null)
    if (!name.trim() || !email.includes('@') || password.length < 6) { setError('Fill name, a valid email and a password of at least 6 characters.'); return }
    if (!classId) { setError('Pick the ward\'s class.'); return }
    setBusy(true)
    try {
      const res = await api.createStudentAccount({ name, email, password, classId, parentId })
      if (!res.ok) { setError(res.message); return }
      router.back()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen scroll>
      <Header title="Add ward" subtitle="Parent → student" />
      {!cloudMode ? (
        <Notice tone="warn">Sign in with your parent (Firebase) account first — ward accounts can only be created from cloud mode.</Notice>
      ) : null}
      <Card>
        <Text style={[F.body2, { lineHeight: 20 }]}>
          The ward gets their own email and password and appears under your children as a linked account.
        </Text>
        <TextInput value={name} onChangeText={setName} placeholder="Ward name" placeholderTextColor={C.text3} style={styles.input} />
        <TextInput value={email} onChangeText={setEmail} placeholder="Email (their sign-in)" placeholderTextColor={C.text3} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Password (min 6 chars)" placeholderTextColor={C.text3} secureTextEntry style={styles.input} />
      </Card>

      <SectionHeader title="Class" />
      <Card>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {db.classes.map((c) => (
            <Chip key={c.id} label={`${c.name} ${c.section}`} tone={classId === c.id ? 'info' : 'neutral'} onPress={() => setClassId(c.id)} selected={classId === c.id} />
          ))}
          {!db.classes.length ? <Text style={F.caption}>No classes on record yet — ask the school to create one.</Text> : null}
        </Row>
      </Card>

      {error ? <Text style={{ color: C.danger, fontWeight: '700', fontSize: 12.5, marginTop: S.md }}>{error}</Text> : null}
      <Btn label={busy ? 'Creating account…' : 'Create ward account'} onPress={submit} loading={busy} disabled={!cloudMode} style={{ marginTop: S.md }} />
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