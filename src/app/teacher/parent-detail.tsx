import React, { useState } from 'react'
import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Btn, Field, Input, Notice, SectionHeader, Avatar } from '@/components/ui'
import { className, studentName } from '@/data/stats'

export default function ParentDetailScreen() {
  const params = useLocalSearchParams<{ parentId?: string }>()
  const { db } = useStore()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [sent, setSent] = useState(false)

  const parent = db.parents.find((p) => p.id === String(params.parentId ?? ''))
  const pu = parent ? db.users.find((u) => u.id === parent.userId) : null
  if (!parent || !pu) return <Screen><Header title="Parent" /><Text style={{ padding: S.lg }}>Parent not found.</Text></Screen>

  const children = db.parentLinks.filter((l) => l.parentId === parent.id).map((l) => db.students.find((s) => s.id === l.studentId)!).filter(Boolean)

  const send = () => {
    if (!title.trim() || !body.trim()) return
    api.sendNotification([pu.id], title.trim(), body.trim(), 'announcement', priority)
    setTitle('')
    setBody('')
    setSent(true)
  }

  return (
    <Screen scroll>
      <Header title="Parent profile" subtitle="View family and send a message" />

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar name={pu.name} hue={pu.avatarHue ?? 0} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={F.h2}>{pu.name}</Text>
          <Text style={[F.caption, { marginTop: 1 }]}>{children.length} linked child{children.length === 1 ? '' : 'ren'}</Text>
        </View>
      </Card>

      <SectionHeader title="Children" />
      <Card>
        {children.length ? children.map((c) => (
          <Row key={c.id} gap={10} style={{ paddingVertical: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary }} />
            <Text style={[F.body2, { flex: 1 }]}>{studentName(db, c.id)}</Text>
            <Text style={[F.caption, { color: C.text3 }]}>{className(db, c.classId)}</Text>
          </Row>
        )) : <Text style={F.caption}>No children linked.</Text>}
      </Card>

      <SectionHeader title="Send a notification" />
      <Card>
        <Field label="Title">
          <Input value={title} onChangeText={setTitle} placeholder="e.g. Class trip permission" />
        </Field>
        <Field label="Message">
          <Input value={body} onChangeText={setBody} placeholder="Write the message for this parent…" multiline style={{ minHeight: 90 }} />
        </Field>
        <Row gap={8} style={{ marginTop: S.sm }}>
          {(['low', 'medium', 'high'] as const).map((p) => (
            <Btn key={p} label={p} variant={priority === p ? 'primary' : 'soft'} size="sm" onPress={() => setPriority(p)} />
          ))}
        </Row>
        <Btn label="Send notification" onPress={send} style={{ marginTop: S.md }} />
        {sent ? <View style={{ marginTop: S.sm }}><Notice tone="success">Notification sent to {pu.name}.</Notice></View> : null}
      </Card>
    </Screen>
  )
}