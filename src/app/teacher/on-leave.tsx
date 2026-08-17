import React, { useState } from 'react'
import { View, Text } from 'react-native'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Btn, Field, Input, Notice, SectionHeader, Chip } from '@/components/ui'
import { teacherOf } from '@/data/stats'
import { todayISO, addDays, formatHuman } from '@/utils/date'

export default function TeacherOnLeaveScreen() {
  const { db, user } = useStore()
  const teacher = teacherOf(db, user?.id ?? '')
  const today = todayISO()
  const [date, setDate] = useState(today)
  const [fullDay, setFullDay] = useState(true)
  const [periods, setPeriods] = useState<number[]>([1, 2])
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ date: string; label: string } | null>(null)

  if (!teacher) return null

  const maxPeriod = db.timetable.filter((e) => e.classId && e.day === new Date(date + 'T00:00:00').getDay()).reduce((m, e) => Math.max(m, e.period), 0) || 8

  const submit = () => {
    if (!reason.trim()) { setError('Add a short reason for your leave.'); return }
    const label = fullDay ? 'the full day' : `periods ${[...periods].sort((a, b) => a - b).join(', ')}`
    api.requestLeave({ teacherId: teacher.id, date, periods: fullDay ? [] : periods, reason: reason.trim() })
    setDone({ date, label })
    setReason('')
    setError(null)
  }

  const periodOptions = Array.from({ length: Math.min(maxPeriod, 8) }, (_, i) => i + 1)

  return (
    <Screen scroll>
      <Header title="Mark on leave" subtitle="School is notified for substitution arrangement" />

      <Card>
        <Text style={F.h2}>Date</Text>
        <Row gap={8} style={{ flexWrap: 'wrap', marginTop: S.sm }}>
          {[today, addDays(today, 1), addDays(today, 2)].map((d) => (
            <Chip key={d} label={d === today ? 'Today' : formatHuman(d)} tone={date === d ? 'info' : 'neutral'} onPress={() => setDate(d)} selected={date === d} />
          ))}
        </Row>
      </Card>

      <Card style={{ marginTop: S.md }}>
        <Text style={F.h2}>Coverage</Text>
        <Row gap={8} style={{ marginTop: S.sm }}>
          <Chip label="Full day" tone={fullDay ? 'info' : 'neutral'} onPress={() => setFullDay(true)} selected={fullDay} />
          <Chip label="Specific periods" tone={!fullDay ? 'info' : 'neutral'} onPress={() => setFullDay(false)} selected={!fullDay} />
        </Row>
        {!fullDay ? (
          <Row gap={8} style={{ flexWrap: 'wrap', marginTop: S.sm }}>
            {periodOptions.map((p) => (
              <Chip key={p} label={`P${p}`} tone={periods.includes(p) ? 'info' : 'neutral'} onPress={() => setPeriods(periods.includes(p) ? periods.filter((x) => x !== p) : [...periods, p])} selected={periods.includes(p)} />
            ))}
          </Row>
        ) : null}
      </Card>

      <Card style={{ marginTop: S.md }}>
        <Field label="Reason">
          <Input value={reason} onChangeText={setReason} placeholder="e.g. Medical appointment, family function…" multiline style={{ minHeight: 80 }} />
        </Field>
        {error ? <Text style={{ color: C.danger, fontWeight: '700', fontSize: 12.5, marginTop: 6 }}>{error}</Text> : null}
        <Btn label="Submit leave request" onPress={submit} style={{ marginTop: S.md }} />
        {done ? <View style={{ marginTop: S.sm }}><Notice tone="success">Request sent — the school has been notified to arrange a substitution for {done.date} ({done.label}).</Notice></View> : null}
      </Card>

      <SectionHeader title="How it works" />
      <Card>
        {[
          ['Notify the school', 'Your leave request appears in the admin Substitution tab instantly.'],
          ['Substitute arranged', 'The admin assigns another teacher to cover your periods.'],
          ['You get updates', 'You are notified when the leave is approved and when a substitute is assigned.'],
        ].map(([k, v]) => (
          <Row key={k} gap={10} style={{ paddingVertical: 6 }}>
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: C.primary }}>✓</Text>
            </View>
            <Text style={[F.body2, { flex: 1 }]}>{k}</Text>
            <Text style={[F.caption, { flex: 1.4 }]}>{v}</Text>
          </Row>
        ))}
      </Card>
    </Screen>
  )
}