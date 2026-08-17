import React, { useState } from 'react'
import { View, Text, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Avatar, Btn, Notice, SectionHeader } from '@/components/ui'
import { Icon } from '@/components/icons'
import { parentOf, linkedChildren } from '@/data/stats'

export default function ParentChildrenScreen() {
  const { db, user } = useStore()
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const parent = parentOf(db, user?.id ?? '')
  if (!parent) return null
  const children = linkedChildren(db, parent.id)

  const link = () => {
    setError(null); setOk(null)
    if (!code.trim()) { setError('Enter a linking code.'); return }
    const res = api.linkChildByCode(parent.id, code)
    if (res.ok) {
      setOk(`Child linked successfully.`)
      setCode('')
    } else {
      setError(res.message)
    }
  }

  return (
    <Screen scroll>
      <Header title="Manage children" subtitle="Link a child using the code from their school" />
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: S.md }}>
        <Btn label="+ Create ward account" variant="soft" size="sm" onPress={() => router.push('/parent/add-ward')} style={{ flex: 1 }} />
      </View>
      <Card>
        <Text style={[F.h3, { color: C.primary }]}>Link a new child</Text>
        <Text style={[F.caption, { marginTop: 4, lineHeight: 17 }]}>Each student has a linking code (shown on the student's profile — ask your child's school for it).</Text>
        <TextInput
          value={code}
          onChangeText={(t) => { setCode(t); setError(null); setOk(null) }}
          placeholder="e.g. aarav-7f3k"
          autoCapitalize="none"
          autoCorrect={false}
          style={{ borderWidth: 1.5, borderColor: error ? C.danger : C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '700', marginTop: S.md, backgroundColor: '#fff' }}
        />
        {error ? <Text style={{ color: C.danger, fontWeight: '700', fontSize: 12, marginTop: 6 }}>{error}</Text> : null}
        {ok ? <Text style={{ color: C.success, fontWeight: '700', fontSize: 12, marginTop: 6 }}>{ok}</Text> : null}
        <Btn label="Link child" onPress={link} style={{ marginTop: S.md }} />
      </Card>

      <SectionHeader title="Linked children" />
      <View style={{ gap: 8 }}>
        {children.map((c) => {
          const u = db.users.find((x) => x.id === c.userId)!
          return (
            <Card key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar name={u.name} hue={u.avatarHue} size={38} />
              <View style={{ flex: 1 }}>
                <Text style={F.h3}>{u.name}</Text>
                <Text style={[F.caption, { marginTop: 1 }]}>Linking code: {db.parentLinks.find((l) => l.parentId === parent.id && l.studentId === c.id)?.code ?? '—'}</Text>
              </View>
              <Row gap={6}>
                <Btn label="Reports" variant="soft" size="sm" onPress={() => router.push(`/parent/child-reports?studentId=${c.id}`)} />
                <Btn label="Remove" variant="danger" size="sm" onPress={() => { api.unlinkChild(parent.id, c.id); }} />
              </Row>
            </Card>
          )
        })}
      </View>

      <Notice tone="info">Parents can only see their own children's data. Removal can be done at any time.</Notice>
    </Screen>
  )
}