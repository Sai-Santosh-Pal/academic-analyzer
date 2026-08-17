import React, { useState } from 'react'
import { View, Text, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore, api, store } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Btn, Notice } from '@/components/ui'

export default function AddParentScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cloudMode = store.isCloudMode

  const submit = async () => {
    setError(null)
    if (!name.trim() || !email.includes('@') || password.length < 6) { setError('Fill name, a valid email and a password of at least 6 characters.'); return }
    setBusy(true)
    try {
      const res = await api.createParentAccount({ name, email, password })
      if (!res.ok) { setError(res.message); return }
      router.back()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen scroll>
      <Header title="Invite parent" subtitle="Teacher → parent" />
      {!cloudMode ? (
        <Notice tone="warn">Sign in with your school (Firebase) account first — parent accounts can only be created from cloud mode.</Notice>
      ) : null}
      <Card>
        <Text style={[F.body2, { lineHeight: 20 }]}>
          The parent gets their own email and password. After signing in, they add their wards (students) to complete the chain.
        </Text>
        <TextInput value={name} onChangeText={setName} placeholder="Parent name" placeholderTextColor={C.text3} style={styles.input} />
        <TextInput value={email} onChangeText={setEmail} placeholder="Email (their sign-in)" placeholderTextColor={C.text3} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Temporary password (min 6 chars)" placeholderTextColor={C.text3} secureTextEntry style={styles.input} />
        {error ? <Text style={{ color: C.danger, fontWeight: '700', fontSize: 12.5, marginTop: 8 }}>{error}</Text> : null}
        <Btn label={busy ? 'Creating account…' : 'Create parent account'} onPress={submit} loading={busy} disabled={!cloudMode} style={{ marginTop: S.md }} />
      </Card>
      <Notice tone="info">Share the credentials with the parent — then their ward can be added from the parent account.</Notice>
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