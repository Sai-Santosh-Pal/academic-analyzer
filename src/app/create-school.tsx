import React, { useState } from 'react'
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Btn, Notice } from '@/components/ui'

export default function CreateSchoolScreen() {
  const router = useRouter()
  const { session } = useStore()
  const [schoolName, setSchoolName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (session) {
    return <Redirect href="/admin" />
  }

  const submit = async () => {
    setError(null)
    if (!schoolName.trim() || !adminName.trim()) { setError('Enter the school and administrator names.'); return }
    if (!email.includes('@')) { setError('Enter a valid email address.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setBusy(true)
    try {
      const res = await api.signUpSchoolAccount(schoolName, adminName, email, password)
      if (!res.ok) { setError(res.message); return }
      router.replace('/admin')
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll>
        <Header title="Create school account" subtitle="The school sits at the top of the hierarchy" />
        <Card>
          <Text style={[F.body2, { lineHeight: 20 }]}>
            The school account is created first. From it, administrators add teachers — teachers then invite parents, who add their wards. Every account below gets its own email and password.
          </Text>
          <TextInput value={schoolName} onChangeText={setSchoolName} placeholder="School name" placeholderTextColor={C.text3} style={styles.input} />
          <TextInput value={adminName} onChangeText={setAdminName} placeholder="Administrator name" placeholderTextColor={C.text3} style={styles.input} />
          <TextInput value={email} onChangeText={setEmail} placeholder="Admin email" placeholderTextColor={C.text3} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" style={styles.input} />
          <TextInput value={password} onChangeText={setPassword} placeholder="Password (min 6 characters)" placeholderTextColor={C.text3} secureTextEntry style={styles.input} />
          <TextInput value={confirm} onChangeText={setConfirm} placeholder="Confirm password" placeholderTextColor={C.text3} secureTextEntry style={styles.input} />
          {error ? <Text style={{ color: C.danger, fontWeight: '700', fontSize: 12.5, marginTop: 8 }}>{error}</Text> : null}
          <Btn label={busy ? 'Creating…' : 'Create school account'} onPress={submit} loading={busy} style={{ marginTop: S.md }} />
        </Card>
        <Notice tone="info">The school is provisioned with a subject catalog. Add classes, then teachers, and the flow continues down the hierarchy.</Notice>
      </Screen>
    </KeyboardAvoidingView>
  )
}

const styles = {
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginTop: S.md,
    backgroundColor: '#fff',
  },
}