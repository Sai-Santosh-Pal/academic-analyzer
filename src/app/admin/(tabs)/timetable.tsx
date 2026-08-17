import React, { useState } from 'react'
import { View, Text } from 'react-native'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, SectionHeader, Btn, Notice } from '@/components/ui'
import { Icon } from '@/components/icons'
import { conflictCheck, className, subjectName } from '@/data/stats'
import { weekdayName } from '@/utils/date'

const DAYS = [0, 1, 2, 3, 4, 5]

export default function AdminTimetable() {
  const { db } = useStore()
  const [filterDay, setFilterDay] = useState(0)
  const conflicts = conflictCheck(db)
  const dayConflicts = conflicts.filter((c) => c.entry.day === filterDay)
  const entries = db.timetable.filter((t) => t.day === filterDay).sort((a, b) => a.period - b.period)

  const remove = (id: string) => {
    api.deleteTimetableEntry(id)
  }

  return (
    <Screen scroll>
      <Header title="Timetable builder" subtitle="Scheduled periods with automatic conflict detection" />

      <Row gap={8} style={{ marginBottom: S.md, flexWrap: 'wrap' }}>
        {DAYS.map((d) => (
          <Chip key={d} label={weekdayName(d).slice(0, 3)} tone={filterDay === d ? 'info' : 'neutral'} onPress={() => setFilterDay(d)} selected={filterDay === d} />
        ))}
      </Row>

      {dayConflicts.length ? (
        <>
          <SectionHeader title={`${dayConflicts.length} conflict(s) detected`} />
          <View style={{ gap: 8, marginBottom: S.sm }}>
            {dayConflicts.map((c, i) => (
              <Card key={i} style={{ backgroundColor: C.dangerSoft, borderColor: C.danger + '55' }}>
                <Row gap={8}>
                  <Icon name="alert" size={16} color={C.danger} />
                  <View style={{ flex: 1 }}>
                    <Text style={[F.body2, { fontWeight: '800', color: C.danger }]}>
                      {c.type === 'teacher' ? 'Teacher double-booked' : 'Class double-booked'}
                    </Text>
                    <Text style={[F.caption, { marginTop: 2 }]}>
                      Period {c.entry.period} · {subjectName(db, c.entry.subjectId)} ({className(db, c.entry.classId)}) × {subjectName(db, c.with.subjectId)} ({className(db, c.with.classId)})
                    </Text>
                  </View>
                  <Btn label="Remove" variant="danger" size="sm" onPress={() => remove(c.entry.id)} />
                </Row>
              </Card>
            ))}
          </View>
        </>
      ) : (
        <Notice tone="success">No conflicts on {weekdayName(filterDay)}.</Notice>
      )}

      <SectionHeader title={`${weekdayName(filterDay)} — ${entries.length} periods`} />
      <Card style={{ paddingHorizontal: 0, overflow: 'hidden' }}>
        {entries.map((t) => {
          const subj = db.subjects.find((x) => x.id === t.subjectId)!
          const cls = db.classes.find((c) => c.id === t.classId)!
          const teacher = db.teachers.find((x) => x.id === t.teacherId)
          const teacherUser = teacher ? db.users.find((u) => u.id === teacher.userId) : null
          const hasConflict = conflicts.some((c) => c.entry.id === t.id)
          return (
            <Row key={t.id} gap={10} style={{ paddingHorizontal: S.lg, paddingVertical: 10, backgroundColor: hasConflict ? C.dangerSoft : undefined, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <View style={{ width: 46 }}>
                <Text style={[F.caption, { fontWeight: '900' }]}>P{t.period}</Text>
                <Text style={[F.micro, { fontSize: 9 }]}>{t.startTime}</Text>
              </View>
              <View style={{ width: 8, height: 34, borderRadius: 4, backgroundColor: subj.color }} />
              <View style={{ flex: 1 }}>
                <Text style={[F.body2, { fontWeight: '700' }]}>{subj.name}</Text>
                <Text style={[F.micro, { fontSize: 9.5, marginTop: 1 }]}>{cls.name} {cls.section} · {teacherUser?.name}</Text>
              </View>
              {hasConflict ? <Icon name="alert" size={15} color={C.danger} /> : <Icon name="check" size={15} color={C.success} />}
            </Row>
          )
        })}
        {!entries.length ? <Text style={[F.body2, { textAlign: 'center', paddingVertical: 14 }]}>No periods scheduled for {weekdayName(filterDay)}.</Text> : null}
      </Card>

      <Notice tone="info">Conflicts (teacher / class double-booking) are detected automatically across the whole week.</Notice>
    </Screen>
  )
}