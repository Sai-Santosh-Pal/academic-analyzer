import React from 'react'
import { View, Text } from 'react-native'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip } from '@/components/ui'
import { studentByUser, classOf, teacherName } from '@/data/stats'
import { weekdayName, todayISO } from '@/utils/date'

export default function TimetableScreen() {
  const { db, user } = useStore()
  const student = studentByUser(db, user?.id ?? '')
  if (!student) return null
  const cls = classOf(db, student.id)!
  const today = todayISO()

  return (
    <Screen scroll>
      <Header title="Timetable" subtitle={`${cls.name} ${cls.section} · weekly schedule`} />
      {[1, 2, 3, 4, 5].map((day) => {
        const entries = db.timetable.filter((t) => t.classId === student.classId && t.day === day).sort((a, b) => a.period - b.period)
        return (
          <View key={day} style={{ marginBottom: S.md }}>
            <Text style={[F.micro, { color: C.primary, marginBottom: 6 }]}>{weekdayName(day).toUpperCase()}</Text>
            <Card style={{ padding: 8 }}>
              {entries.map((t, i) => {
                const subj = db.subjects.find((x) => x.id === t.subjectId)!
                const isToday = new Date(today + 'T00:00:00').getDay() === day
                return (
                  <Row key={t.id} between style={{ paddingVertical: 8, paddingHorizontal: 6, borderRadius: 10, backgroundColor: isToday ? C.primarySoft : 'transparent' }}>
                    <Row gap={10} style={{ flex: 1 }}>
                      <View style={{ width: 26, alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: C.text2 }}>P{t.period}</Text>
                      </View>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: subj.color }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[F.h3, { fontSize: 13.5 }]}>{subj.name}</Text>
                        <Text style={[F.caption, { marginTop: 1 }]}>{t.startTime}–{t.endTime} · {teacherName(db, t.teacherId)}</Text>
                      </View>
                    </Row>
                  </Row>
                )
              })}
            </Card>
          </View>
        )
      })}
    </Screen>
  )
}