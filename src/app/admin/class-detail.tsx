import React from 'react'
import { View, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Avatar, Chip, SectionHeader, Btn } from '@/components/ui'
import { Icon } from '@/components/icons'
import { BarChart, LineChart, Legend } from '@/components/charts'
import { className, classAverage, subjectPerformanceSchool, earlyWarningFlags, recentAssessments, assessmentClassStats, subjectName, studentName, teacherStudents } from '@/data/stats'

export default function AdminClassDetail() {
  const params = useLocalSearchParams<{ classId: string }>()
  const { db } = useStore()
  const router = useRouter()
  const cls = db.classes.find((c) => c.id === String(params.classId))
  if (!cls) return <Screen><Header title="Class" /><Text>Not found</Text></Screen>
  const students = db.students.filter((s) => s.classId === cls.id)
  const avg = classAverage(db, cls.id)
  const subjects = cls.subjectIds.map((sid) => db.subjects.find((x) => x.id === sid)!).filter(Boolean)
  const subjectAvgs = subjects.map((s) => ({ name: s.name, color: s.color, avg: classAverage(db, cls.id, s.id) ?? 0 }))
  const flags = earlyWarningFlags(db, cls.id)
  const assessments = recentAssessments(db, cls.id, undefined, 5).reverse()

  return (
    <Screen scroll>
      <Header title={`${cls.name} ${cls.section}`} subtitle={`${students.length} students · ${cls.academicYear}`} />

      <Row gap={8} style={{ marginBottom: S.md }}>
        <Btn label="Edit class" variant="soft" size="sm" onPress={() => router.push(`/admin/class-editor?classId=${cls.id}`)} />
        <Btn label="Timetable" variant="soft" size="sm" onPress={() => router.push(`/admin/class-timetable?classId=${cls.id}`)} />
        <Btn label="AI timetable" variant="soft" size="sm" onPress={() => router.push(`/admin/ai-timetable?classId=${cls.id}`)} />
      </Row>

      <SectionHeader title="Class average by subject" />
      <Card>
        <BarChart data={subjectAvgs.map((s) => ({ label: s.name.slice(0, 4), value: s.avg, color: s.color }))} height={150} />
        <Legend items={subjectAvgs.map((s) => ({ label: s.name, color: s.color, value: `${s.avg}%` }))} />
      </Card>

      <SectionHeader title="Recent assessments" />
      <Card>
        {assessments.map((a) => {
          const s = assessmentClassStats(db, a.id)
          const subj = db.subjects.find((x) => x.id === a.subjectId)!
          return (
            <Row key={a.id} between style={{ paddingVertical: 7 }}>
              <View style={{ flex: 1 }}>
                <Text style={[F.body2, { fontWeight: '700' }]}>{subj.name} — {a.title}</Text>
                <Text style={[F.caption, { marginTop: 1 }]}>{a.date.slice(0, 10)} · avg {s?.avg ?? '—'}%</Text>
              </View>
              <Chip label={`${s?.avg ?? '—'}%`} tone={s && s.avg >= 70 ? 'good' : s && s.avg >= 50 ? 'warn' : 'bad'} />
            </Row>
          )
        })}
        {!assessments.length ? <Text style={F.caption}>No assessments yet.</Text> : null}
      </Card>

      {flags.length ? (
        <>
          <SectionHeader title="Needs attention" />
          <View style={{ gap: 8 }}>
            {flags.map((f) => (
              <Card key={f.studentId} onPress={() => router.push(`/admin/student-detail?studentId=${f.studentId}`)}>
                <Row between>
                  <View style={{ flex: 1 }}>
                    <Text style={F.h3}>{studentName(db, f.studentId)}</Text>
                    {f.suggestion ? <Text style={[F.caption, { marginTop: 2 }]} numberOfLines={1}>{f.suggestion}</Text> : null}
                  </View>
                  <Chip label={f.reasons[0] ?? 'Flagged'} tone={f.level === 'urgent' ? 'bad' : 'warn'} />
                </Row>
              </Card>
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader title="Roster" />
      <View style={{ gap: 8 }}>
        {students.map((s) => {
          const u = db.users.find((x) => x.id === s.userId)!
          return (
            <Card key={s.id} onPress={() => router.push(`/admin/student-detail?studentId=${s.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar name={u.name} hue={u.avatarHue} size={32} />
              <View style={{ flex: 1 }}>
                <Text style={[F.body2, { fontWeight: '700' }]}>{u.name}</Text>
                <Text style={[F.caption, { marginTop: 1 }]}>Roll {s.rollNumber}</Text>
              </View>
              <Icon name="chevron" size={14} color={C.text3} />
            </Card>
          )
        })}
      </View>
    </Screen>
  )
}