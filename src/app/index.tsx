import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S, shadow } from '@/theme'
import { Icon, IconName } from '@/components/icons'
import { Card, Notice, Btn } from '@/components/ui'

const DEMO_ACCOUNTS: { role: 'student' | 'teacher' | 'parent' | 'admin'; label: string; desc: string; userId: string; icon: IconName; color: string; soft: string }[] = [
  { role: 'student', label: 'Student', desc: 'Aarav Sharma · XI-A', userId: 'usr_student_demo', icon: 'user', color: C.primary, soft: C.primarySoft },
  { role: 'teacher', label: 'Teacher', desc: 'Kavita Verma · Physics', userId: 'usr_teacher_demo', icon: 'bookOpen', color: C.accent, soft: C.accentSoft },
  { role: 'parent', label: 'Parent', desc: 'Rahul Sharma · 2 children', userId: 'usr_parent_demo', icon: 'users', color: C.success, soft: C.successSoft },
  { role: 'admin', label: 'Administrator', desc: 'Priya Deshmukh · Principal', userId: 'usr_admin_demo', icon: 'school', color: C.ai, soft: C.aiSoft },
]

const ROLE_HOME: Record<string, string> = {
  student: '/student',
  teacher: '/teacher',
  parent: '/parent',
  admin: '/admin',
}

export default function LoginScreen() {
  const { session, cloudError } = useStore()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (session) {
    return <Redirect href={ROLE_HOME[session.role] ?? '/'} />
  }

  const signIn = async () => {
    setError(null)
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setBusy(true)
    try {
      const res = await api.signInCloud(email, password)
      if (!res.ok) {
        console.warn('[sign-in] failed:', res.message)
        setError(res.message)
      }
    } catch (e) {
      console.warn('[sign-in] unexpected error:', e)
      setError('Something went wrong. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingTop: 64, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: C.black, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="school" size={18} color="#fff" strokeWidth={2} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '800', letterSpacing: -0.2 }}>Academic Analyzer</Text>
        </View>

        <Text style={{ fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginTop: 28 }}>Sign in</Text>
        <Text style={[F.body2, { marginTop: 4 }]}>Continue to your account. New school? Create one below.</Text>

        <Card style={{ marginTop: S.lg, ...shadow.card }}>
          <TextInput
            value={email}
            onChangeText={(t) => { setEmail(t); setError(null) }}
            placeholder="Email"
            placeholderTextColor={C.text3}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={(t) => { setPassword(t); setError(null) }}
            placeholder="Password"
            placeholderTextColor={C.text3}
            secureTextEntry
            style={styles.input}
          />
          {error || cloudError ? (
            <View style={{ marginTop: S.md }}>
              <Notice tone="danger">{error ?? cloudError}</Notice>
            </View>
          ) : null}
          <Btn label={busy ? 'Signing in…' : 'Sign in'} onPress={signIn} loading={busy} style={{ marginTop: S.md }} />
          <TouchableOpacity onPress={() => router.push('/create-school')} style={{ marginTop: S.md, alignSelf: 'center' }}>
            <Text style={[F.body, { color: C.primary, fontWeight: '700' }]}>Create a school account →</Text>
          </TouchableOpacity>
        </Card>

        <Card style={{ marginTop: S.md }}>
          <Text style={F.h1}>Demo access</Text>
          <Text style={[F.body2, { marginTop: 4 }]}>Offline sample data — explore all four roles without an account.</Text>
          <View style={{ marginTop: S.md, gap: 10 }}>
            {DEMO_ACCOUNTS.map((a) => (
              <TouchableOpacity
                key={a.role}
                activeOpacity={0.85}
                onPress={async () => { await api.signOutCloudAccount(); api.login(a.userId, a.role) }}
                style={[styles.demoRow, { backgroundColor: a.soft }]}
              >
                <View style={[styles.demoIcon, { backgroundColor: a.color }]}>
                  <Icon name={a.icon} size={17} color="#fff" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[F.h3, { color: a.color }]}>{a.label}</Text>
                  <Text style={[F.caption, { color: C.text2 }]}>{a.desc}</Text>
                </View>
                <Icon name="chevron" size={17} color={a.color} />
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <TouchableOpacity onPress={() => api.resetDemo()} style={{ alignSelf: 'center', marginTop: S.lg }}>
          <Text style={[F.caption, { color: C.text3, textDecorationLine: 'underline' }]}>Reset demo data</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  demoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14,
    padding: 12, paddingRight: 14,
  },
  demoIcon: {
    width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginTop: S.md,
    backgroundColor: '#fff',
  },
})