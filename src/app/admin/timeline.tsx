import React, { useState } from 'react'
import { View, Text } from 'react-native'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Btn, Field, Input, Chip, EmptyState, Notice } from '@/components/ui'
import { TimelineAudience } from '@/data/types'
import { todayISO, addDays, formatHuman } from '@/utils/date'

const AUDIENCES: { key: TimelineAudience; label: string }[] = [
  { key: 'all', label: 'Everyone' },
  { key: 'teacher', label: 'Teachers' },
  { key: 'parent', label: 'Parents' },
  { key: 'student', label: 'Students' },
]

const AUDIENCE_LABEL: Record<string, string> = { all: 'Everyone', teacher: 'Teachers', parent: 'Parents', student: 'Students' }

export default function AdminTimelineScreen() {
  const { db } = useStore()
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [date, setDate] = useState(todayISO())
  const [audience, setAudience] = useState<TimelineAudience>('all')
  const [ok, setOk] = useState(false)

  const events = [...db.timelineEvents].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  const submit = () => {
    if (!title.trim()) return
    api.addTimelineEvent({ title, detail, date, audience })
    setTitle('')
    setDetail('')
    setOk(true)
    setTimeout(() => setOk(false), 2500)
  }

  return (
    <Screen scroll>
      <Header title="School timeline" subtitle="Add events that appear in teacher, parent and student timelines" />

      <Card style={{ marginBottom: S.md }}>
        <Field label="New timeline event">
          <Input value={title} onChangeText={setTitle} placeholder="e.g. Half-yearly exams start, PTA meeting…" />
          <Input value={detail} onChangeText={setDetail} placeholder="Details (optional)" multiline style={{ minHeight: 60, marginTop: S.sm }} />
        </Field>
        <Field label="Date">
          <Row gap={8}>
            {[todayISO(), addDays(todayISO(), 1), addDays(todayISO(), 2)].map((d) => (
              <Chip key={d} label={formatHuman(d, { weekday: true })} tone={date === d ? 'info' : 'neutral'} selected={date === d} onPress={() => setDate(d)} />
            ))}
          </Row>
        </Field>
        <Field label="Shown to">
          <Row gap={8}>
            {AUDIENCES.map((a) => (
              <Chip key={a.key} label={a.label} tone={audience === a.key ? 'info' : 'neutral'} selected={audience === a.key} onPress={() => setAudience(a.key)} />
            ))}
          </Row>
        </Field>
        <Btn label="Add to timeline" onPress={submit} style={{ marginTop: S.sm }} />
        {ok ? <Notice tone="success">{`Added for ${AUDIENCE_LABEL[audience]} on ${formatHuman(date)}`}</Notice> : null}
      </Card>

      <Text style={[F.h2, { marginBottom: S.sm }]}>Posted events</Text>
      {events.length ? (
        <View style={{ gap: 8 }}>
          {events.map((e) => (
            <Card key={e.id} style={{ padding: 12 }}>
              <Row between>
                <Text style={[F.h3, { fontSize: 13.5, flex: 1 }]}>{e.title}</Text>
                <Chip label={AUDIENCE_LABEL[e.audience] ?? e.audience} tone={e.audience === 'all' ? 'info' : 'neutral'} />
              </Row>
              {e.detail ? <Text style={[F.caption, { marginTop: 3 }]}>{e.detail}</Text> : null}
              <Text style={[F.caption, { marginTop: 6, color: C.primary }]}>{formatHuman(e.date, { weekday: true })}</Text>
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState icon="calendar" title="No timeline events yet" />
      )}
    </Screen>
  )
}