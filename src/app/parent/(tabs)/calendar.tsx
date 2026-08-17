import React from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore } from '@/data/store'
import { useSelectedChildId } from '@/data/parent-select'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, SectionHeader } from '@/components/ui'
import { ChildSwitcher } from '@/components/child-switcher'
import { parentOf, linkedChildren, classOf, upcomingAssessments } from '@/data/stats'
import { relativeDayLabel, weekday, todayISO, addDays } from '@/utils/date'

export default function ParentCalendar() {
  const { db, user } = useStore()
  const router = useRouter()
  const parent = parentOf(db, user?.id ?? '')
  const selected = useSelectedChildId()
  if (!parent) return null
  const child = (linkedChildren(db, parent.id).find((c) => c.id === selected) ?? linkedChildren(db, parent.id)[0])
  if (!child) return null
  const cls = classOf(db, child.id)!
  const upcoming = upcomingAssessments(db, child.classId)
  const today = todayISO()
  const wd = weekday(today)
  const todaysTT = db.timetable.filter((t) => t.classId === child.classId && t.day === wd)
  const wk = [...Array(7)].map((_, i) => addDays(today, i))
  const weekTT = wk.flatMap((d) => db.timetable.filter((t) => t.classId === child.classId && t.day === weekday(d)).map((t) => ({ ...t, day: d })))
  const deadlines = db.assignments
    .filter((a) => a.classId === child.classId && a.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8)

  return (
    <Screen scroll>
      <Header title="Calendar" subtitle="Assessments, timetable & deadlines" />
      {linkedChildren(db, parent.id).length > 1 ? (
        <View style={{ marginBottom: S.md }}>
          <ChildSwitcher />
        </View>
      ) : null}

      <SectionHeader title="Upcoming assessments" />
      <View style={{ gap: 8 }}>
        {upcoming.map((a) => {
          const subj = db.subjects.find((x) => x.id === a.subjectId)!
          return (
            <Card key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 8, height: 38, borderRadius: 4, backgroundColor: subj.color }} />
              <View style={{ flex: 1 }}>
                <Text style={F.h3}>{subj.name} — {a.title}</Text>
                <Text style={[F.caption, { marginTop: 2 }]}>{relativeDayLabel(a.date)} · max {a.maxMarks}</Text>
              </View>
              <Chip label="Upcoming" tone="info" />
            </Card>
          )
        })}
        {!upcoming.length ? <Card><Text style={[F.body2, { textAlign: 'center', paddingVertical: 8 }]}>No upcoming assessments.</Text></Card> : null}
      </View>

      <SectionHeader title="This week's timetable" />
      {weekTT.length ? (
        <Card style={{ paddingHorizontal: 0, overflow: 'hidden' }}>
          {weekTT.map((t) => {
            const subj = db.subjects.find((x) => x.id === t.subjectId)!
            const isToday = t.day === today
            return (
              <Row key={t.id} gap={10} style={{ paddingHorizontal: S.lg, paddingVertical: 7, backgroundColor: isToday ? C.primarySoft : undefined }}>
                <Text style={{ width: 74, fontSize: 11, fontWeight: '800', color: isToday ? C.primary : C.text3 }}>{relativeDayLabel(t.day)}</Text>
                <Text style={[F.caption, { fontWeight: '800', width: 42 }]}>{t.startTime}</Text>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: subj.color }} />
                <Text style={[F.body2, { flex: 1 }]}>{subj.name}</Text>
              </Row>
            )
          })}
        </Card>
      ) : null}

      <SectionHeader title="Assignment deadlines" />
      <View style={{ gap: 8 }}>
        {deadlines.map((a) => {
          const subj = db.subjects.find((x) => x.id === a.subjectId)!
          const dueIn = Math.round((new Date(a.dueDate).getTime() - new Date(today).getTime()) / 86400000)
          return (
            <Card key={a.id}>
              <Row between>
                <View style={{ flex: 1 }}>
                  <Text style={F.h3}>{a.title}</Text>
                  <Text style={[F.caption, { marginTop: 2 }]}>{subj.name} · due {relativeDayLabel(a.dueDate)}</Text>
                </View>
                <Chip label={dueIn <= 1 ? 'Due soon' : `in ${dueIn}d`} tone={dueIn <= 1 ? 'bad' : 'info'} />
              </Row>
            </Card>
          )
        })}
        {!deadlines.length ? <Card><Text style={[F.body2, { textAlign: 'center', paddingVertical: 8 }]}>No pending deadlines.</Text></Card> : null}
      </View>
    </Screen>
  )
}