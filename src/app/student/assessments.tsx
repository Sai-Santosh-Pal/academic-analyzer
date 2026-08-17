import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, Delta, SectionHeader, EmptyState } from '@/components/ui'
import { Icon } from '@/components/icons'
import { studentByUser, classOf, subjectName, assessmentOf, marksFor } from '@/data/stats'
import { upcomingAssessments, recentAssessments } from '@/data/stats'
import { relativeDayLabel, formatHuman } from '@/utils/date'
import { pct } from '@/data/stats'

export default function AssessmentsScreen() {
  const { db, user } = useStore()
  const router = useRouter()
  const student = studentByUser(db, user?.id ?? '')
  if (!student) return null

  const upcoming = upcomingAssessments(db, student.classId)
  const recent = recentAssessments(db, student.classId, undefined, 10)

  return (
    <Screen scroll>
      <Header title="Assessments" subtitle={`${classNameOf(student.classId)} · ${recent.length} completed`} />

      <SectionHeader title="Upcoming" />
      {!upcoming.length ? <EmptyState icon="calendar" title="Nothing scheduled" sub="No upcoming assessments." /> : null}
      <View style={{ gap: 8 }}>
        {upcoming.map((a) => {
          const subj = db.subjects.find((x) => x.id === a.subjectId)!
          return (
            <Card key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: subj.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="target" size={18} color={subj.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={F.h3}>{subj.name} · {a.title}</Text>
                <Text style={[F.caption, { marginTop: 2 }]}>{relativeDayLabel(a.date)} · {a.maxMarks} marks</Text>
              </View>
              <Chip label="Upcoming" tone="info" />
            </Card>
          )
        })}
      </View>

      <SectionHeader title="History" />
      <View style={{ gap: 8 }}>
        {recent.map((a) => {
          const subj = db.subjects.find((x) => x.id === a.subjectId)!
          const mark = marksFor(db, student.id, a.subjectId).find((m) => m.assessmentId === a.id)
          const myPct = mark ? Math.round(pct(mark.score, a.maxMarks)) : null
          const prev = recentAssessments(db, student.classId, a.subjectId, 10)[1]
          return (
            <Card key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} onPress={() => router.push('/student/subjects?subjectId=' + a.subjectId)}>
              <View style={{ width: 8, height: 36, borderRadius: 4, backgroundColor: subj.color }} />
              <View style={{ flex: 1 }}>
                <Text style={F.h3}>{subj.name} · {a.title}</Text>
                <Text style={[F.caption, { marginTop: 1 }]}>{formatHuman(a.date)} · {mark ? `${mark.score}/${a.maxMarks}` : '—'}</Text>
              </View>
              {myPct !== null ? (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: myPct >= 60 ? C.success : C.danger }}>{myPct}%</Text>
                </View>
              ) : <Chip label="Not marked" tone="neutral" />}
            </Card>
          )
        })}
      </View>
    </Screen>
  )

  function classNameOf(classId: string) {
    const c = db.classes.find((x) => x.id === classId)!
    return `${c.name} ${c.section}`
  }
}