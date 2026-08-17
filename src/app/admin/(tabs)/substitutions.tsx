import React, { useState } from 'react'
import { View, Text } from 'react-native'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, Btn, EmptyState, Avatar } from '@/components/ui'
import { teacherName } from '@/data/stats'
import { parseISO } from '@/utils/date'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function AdminSubstitutionsScreen() {
  const { db } = useStore()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending')

  const leaves = [...db.leaves].sort((a, b) => (a.status === 'pending' ? -1 : 1) - (b.status === 'pending' ? -1 : 1) || b.createdAt.localeCompare(a.createdAt))
  const shown = leaves.filter((l) => filter === 'all' || (filter === 'pending' ? l.status === 'pending' : l.status !== 'pending'))

  // teachers who teach what the on-leave teacher teaches and are free that day/periods
  const candidatesFor = (leave: { teacherId: string; substituteId?: string; date: string; periods?: number[] }) => {
    const orig = db.teachers.find((t) => t.id === leave.teacherId)
    const day = parseISO(leave.date).getDay()
    const anyPeriod = !leave.periods?.length
    const busy = db.timetable.filter((e) => e.day === day && (anyPeriod || (leave.periods ?? []).includes(e.period))).map((e) => e.teacherId)
    return db.teachers
      .filter((t) => t.id !== leave.teacherId)
      .filter((t) => t.id !== leave.substituteId)
      .filter((t) => !busy.includes(t.id))
      .sort((a, b) => {
        const aMatch = orig ? a.subjectIds.some((sid) => orig.subjectIds.includes(sid)) : false
        const bMatch = orig ? b.subjectIds.some((sid) => orig.subjectIds.includes(sid)) : false
        return Number(bMatch) - Number(aMatch)
      })
  }

  const periodLabel = (l: { periods?: number[] }) => (l.periods?.length ? `Periods ${l.periods.slice().sort((a, b) => a - b).join(', ')}` : 'Full day')

  return (
    <Screen scroll>
      <Header title="Substitutions" subtitle="Teacher leave requests and cover arrangements" />

      <Row gap={8} style={{ marginBottom: S.md }}>
        <Chip label="Pending" tone={filter === 'pending' ? 'info' : 'neutral'} onPress={() => setFilter('pending')} selected={filter === 'pending'} />
        <Chip label="All" tone={filter === 'all' ? 'info' : 'neutral'} onPress={() => setFilter('all')} selected={filter === 'all'} />
        <Chip label="Done" tone={filter === 'done' ? 'info' : 'neutral'} onPress={() => setFilter('done')} selected={filter === 'done'} />
      </Row>

      {shown.length ? shown.map((l) => {
        const t = db.teachers.find((x) => x.id === l.teacherId)
        const tu = db.users.find((u) => u.id === t?.userId)
        const sub = l.substituteId ? db.teachers.find((x) => x.id === l.substituteId) : null
        const day = DAY_NAMES[parseISO(l.date).getDay()]
        const candidates = expanded === l.id && (l.status === 'pending' || l.status === 'substituted') ? candidatesFor(l) : []
        return (
          <Card key={l.id} style={{ marginBottom: S.sm }}>
            <Row gap={10}>
              {tu ? <Avatar name={tu.name} hue={tu.avatarHue ?? 0} size={36} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={F.h3}>{t ? teacherName(db, t.id) : 'Teacher'}</Text>
                <Text style={[F.caption, { marginTop: 1 }]}>{day}, {l.date} · {periodLabel(l)}</Text>
              </View>
              {l.status === 'pending' ? <Chip label="Pending" tone="warn" /> : l.status === 'substituted' ? <Chip label="Substituted" tone="good" /> : <Chip label={l.status} tone={l.status === 'approved' ? 'info' : 'neutral'} />}
            </Row>
            <Text style={[F.body2, { marginTop: 8 }]}>Reason: {l.reason}</Text>
            {sub ? <Text style={[F.caption, { marginTop: 4, color: C.success }]}>Covered by {teacherName(db, sub.id)}.</Text> : null}
            {l.status === 'pending' ? (
              <View style={{ marginTop: S.sm }}>
                <Row gap={8}>
                  <Btn label="Assign substitute" variant="success" size="sm" onPress={() => setExpanded(expanded === l.id ? null : l.id)} style={{ flex: 1 }} />
                  <Btn label="Decline" variant="danger" size="sm" onPress={() => api.resolveLeave(l.id, 'declined')} style={{ flex: 1 }} />
                </Row>
                {expanded === l.id ? (
                  <View style={{ marginTop: 10 }}>
                    <Btn label={candidates.length ? 'Auto-assign best teacher' : 'Auto-assign — no free teacher'} variant="primary" size="sm" onPress={() => { if (candidates.length) { api.assignSubstitute(l.id, candidates[0].id); setExpanded(null) } }} />
                    {candidates.length ? (
                      <View style={{ marginTop: 10 }}>
                        <Text style={[F.caption, { marginBottom: 6 }]}>Free on {DAY_NAMES[parseISO(l.date).getDay()]} {periodLabel(l).toLowerCase()} (subject match first):</Text>
                        {candidates.map((c) => (
                          <Row key={c.id} between style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border }}>
                            <View style={{ flex: 1 }}>
                              <Text style={F.body2}>{teacherName(db, c.id)}</Text>
                              <Text style={[F.caption, { marginTop: 1 }]}>{db.subjects.filter((s) => c.subjectIds.includes(s.id)).map((s) => s.name).join(', ') || 'No subjects'}</Text>
                            </View>
                            <Btn label="Assign" variant="soft" size="sm" onPress={() => { api.assignSubstitute(l.id, c.id); setExpanded(null) }} />
                          </Row>
                        ))}
                      </View>
                    ) : <Text style={[F.caption, { marginTop: 8, color: C.danger }]}>No free teachers for these periods.</Text>}
                    <Btn label="Approve without substitute" variant="ghost" size="sm" style={{ marginTop: 8 }} onPress={() => api.resolveLeave(l.id, 'approved')} />
                  </View>
                ) : null}
              </View>
            ) : l.status === 'substituted' ? (
              <View style={{ marginTop: S.sm }}>
                <Btn label="Edit substitution" variant="soft" size="sm" onPress={() => setExpanded(expanded === l.id ? null : l.id)} />
                {expanded === l.id ? (
                  <View style={{ marginTop: 10 }}>
                    <Btn label={candidates.length ? 'Auto-assign best teacher' : 'Auto-assign — no free teacher'} variant="primary" size="sm" onPress={() => { if (candidates.length) { api.assignSubstitute(l.id, candidates[0].id); setExpanded(null) } }} />
                    {candidates.length ? (
                      <View style={{ marginTop: 10 }}>
                        <Text style={[F.caption, { marginBottom: 6 }]}>Reassign — free on {DAY_NAMES[parseISO(l.date).getDay()]} {periodLabel(l).toLowerCase()} (subject match first):</Text>
                        {candidates.map((c) => (
                          <Row key={c.id} between style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border }}>
                            <View style={{ flex: 1 }}>
                              <Text style={F.body2}>{teacherName(db, c.id)}</Text>
                              <Text style={[F.caption, { marginTop: 1 }]}>{db.subjects.filter((s) => c.subjectIds.includes(s.id)).map((s) => s.name).join(', ') || 'No subjects'}</Text>
                            </View>
                            <Btn label="Replace" variant="soft" size="sm" onPress={() => { api.assignSubstitute(l.id, c.id); setExpanded(null) }} />
                          </Row>
                        ))}
                      </View>
                    ) : <Text style={[F.caption, { marginTop: 8, color: C.danger }]}>No free teachers for these periods.</Text>}
                  </View>
                ) : null}
              </View>
            ) : null}
          </Card>
        )
      }) : (
        <EmptyState icon="calendar" title={filter === 'pending' ? 'No pending leave requests' : 'No leave requests yet'} />
      )}
    </Screen>
  )
}