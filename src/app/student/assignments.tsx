import React from 'react'
import { View, Text } from 'react-native'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, SectionHeader, EmptyState, Btn } from '@/components/ui'
import { Icon, IconName } from '@/components/icons'
import { studentByUser, studentAssignments, userOf } from '@/data/stats'
import { relativeDayLabel } from '@/utils/date'

const PRIORITY_META: Record<string, { icon: IconName; color: string }> = {
  high: { icon: 'alert', color: C.danger },
  medium: { icon: 'clock', color: C.warning },
  low: { icon: 'check', color: C.success },
}

export default function AssignmentsScreen() {
  const { db, user } = useStore()
  const student = studentByUser(db, user?.id ?? '')
  if (!student) return null

  const list = studentAssignments(db, student.id)
  const done = list.filter((s) => s.status === 'submitted').length
  const pending = list.filter((s) => s.status !== 'submitted')

  return (
    <Screen scroll>
      <Header title="Assignments" subtitle={`${done}/${list.length} completed`} />
      <Row gap={S.md} style={{ marginBottom: S.md }}>
        <Card style={{ flex: 1, padding: 12 }}><Text style={F.caption}>COMPLETED</Text><Text style={{ fontSize: 18, fontWeight: '800', color: C.success }}>{done}/{list.length}</Text></Card>
        <Card style={{ flex: 1, padding: 12 }}><Text style={F.caption}>PENDING</Text><Text style={{ fontSize: 18, fontWeight: '800', color: C.warning }}>{pending.length}</Text></Card>
      </Row>

      {!pending.length ? <EmptyState icon="clipboard" title="All caught up" sub="No pending assignments." /> : null}
      <SectionHeader title="Pending" />
      <View style={{ gap: 8 }}>
        {pending.map((s) => {
          const meta = PRIORITY_META[s.assignment.priority] ?? PRIORITY_META.medium
          const overdue = s.assignment.dueDate < new Date().toISOString().slice(0, 10)
          return (
            <Card key={s.id}>
              <Row between align="flex-start">
                <Row gap={10} style={{ flex: 1 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: s.subject.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={meta.icon} size={16} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={F.h3}>{s.assignment.title}</Text>
                    <Text style={[F.caption, { marginTop: 2 }]}>{s.subject.name} · {userOf(db, db.teachers.find((t) => t.id === s.assignment.teacherId)?.userId ?? '')?.name}</Text>
                  </View>
                </Row>
                <Chip label={s.assignment.priority} tone={s.assignment.priority === 'high' ? 'bad' : s.assignment.priority === 'medium' ? 'warn' : 'good'} />
              </Row>
              <Text style={[F.body2, { marginTop: 8, lineHeight: 18 }]} numberOfLines={2}>{s.assignment.description}</Text>
              <Row between style={{ marginTop: S.sm }}>
                <Text style={[F.caption, { color: overdue ? C.danger : C.text2, fontWeight: '700' }]}>
                  {overdue ? 'Overdue — ' : 'Due '}{relativeDayLabel(s.assignment.dueDate)} · {s.assignment.maxPoints} pts
                </Text>
                <Btn label="Mark complete" variant="soft" size="sm" onPress={() => api.setSubmission(s.assignmentId, student.id, 'submitted')} />
              </Row>
            </Card>
          )
        })}
      </View>

      <SectionHeader title="Completed" />
      <View style={{ gap: 8 }}>
        {list.filter((s) => s.status === 'submitted').slice(-6).reverse().map((s) => (
          <Card key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, opacity: 0.8 }}>
            <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: C.successSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={14} color={C.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[F.h3, { fontSize: 13.5 }]}>{s.assignment.title}</Text>
              <Text style={[F.caption, { marginTop: 1 }]}>{s.subject.name}</Text>
            </View>
            <Text style={[F.caption, { fontWeight: '800', color: C.success }]}>{s.score !== null ? `${s.score}/${s.assignment.maxPoints}` : 'Done'}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  )
}