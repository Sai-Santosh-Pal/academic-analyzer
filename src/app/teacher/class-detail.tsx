import React, { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, SectionHeader, Avatar, Btn, Sheet, Field, Input, Notice } from '@/components/ui'
import { Icon } from '@/components/icons'
import { WhatChangedStrip } from '@/components/what-changed'
import { classPulse, classAverage, classSubjectAverage, whatChangedClass, upcomingAssessments, recentAssessments, teacherName, studentName, earlyWarningFlags, className, teacherStudents, overallAvg, attendanceStats } from '@/data/stats'
import { formatHuman, relativeDayLabel, weekdayName } from '@/utils/date'

export default function ClassDetailScreen() {
  const params = useLocalSearchParams<{ classId: string }>()
  const { db } = useStore()
  const router = useRouter()
  const [noticeSheet, setNoticeSheet] = useState(false)
  const cls = db.classes.find((c) => c.id === params.classId)
  if (!cls) return <Screen><Header title="Class" /><Text>Not found</Text></Screen>

  const students = db.students.filter((s) => s.classId === cls.id)
  const pulse = classPulse(db, cls.id)
  const subjects = classSubjectAverage(db, cls.id)
  const changed = whatChangedClass(db, cls.id)
  const upcoming = upcomingAssessments(db, cls.id)
  const flags = earlyWarningFlags(db, cls.id)
  const clsAssignments = db.assignments.filter((a) => a.classId === cls.id)

  const actions: { label: string; icon: 'user' | 'target' | 'clipboard' | 'send' | 'file' | 'sparkle'; route: string }[] = [
    { label: 'Mark attendance', icon: 'user', route: `/teacher/mark-attendance?classId=${cls.id}` },
    { label: 'Create assessment', icon: 'target', route: `/teacher/enter-marks?classId=${cls.id}` },
    { label: 'Create assignment', icon: 'clipboard', route: `/teacher/interventions?classId=${cls.id}` },
    { label: 'Notify class', icon: 'send', route: `/teacher/notify?classId=${cls.id}` },
    { label: 'Class report cards', icon: 'file', route: `/teacher/reports?classId=${cls.id}` },
    { label: 'AI analysis', icon: 'sparkle', route: `/teacher/ai-tools?tool=class&classId=${cls.id}` },
  ]

  return (
    <Screen scroll>
      <Header title={`Class ${cls.name} ${cls.section}`} subtitle={`${cls.academicYear} · Class teacher ${teacherName(db, cls.classTeacherId)}`} />

      <WhatChangedStrip
        title="WHAT CHANGED · CLASS"
        items={changed.map((c) => ({ label: c.name, value: `${Math.round(c.avg)}%`, delta: c.delta, color: c.color }))}
      />

      <Row gap={8} style={{ marginTop: S.md, flexWrap: 'wrap' }}>
        {actions.map((a) => (
          <TouchableOpacity key={a.label} activeOpacity={0.8} onPress={() => router.push(a.route as never)}>
            <View style={{ backgroundColor: C.primarySoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name={a.icon as never} size={14} color={C.primary} />
              <Text style={{ fontSize: 12, fontWeight: '800', color: C.primary }}>{a.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </Row>

      <SectionHeader title="Class pulse" />
      <Card>
        <Row between>
          <View>
            <Text style={[F.micro, { color: C.text3 }]}>CLASS AVERAGE</Text>
            <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -1 }}>{pulse.avg}%</Text>
          </View>
          <Row gap={6}>
            <Chip label={`↑ ${pulse.improving}`} tone="good" />
            <Chip label={`→ ${pulse.stable}`} tone="info" />
            <Chip label={`↓ ${pulse.declining}`} tone="bad" />
          </Row>
        </Row>
        <View style={{ height: 1, backgroundColor: C.border, marginVertical: S.md }} />
        <Row gap={10}>
          <Card style={{ flex: 1, padding: 10, backgroundColor: C.bg }}><Text style={F.caption}>STUDENTS</Text><Text style={{ fontSize: 18, fontWeight: '800' }}>{students.length}</Text></Card>
          <Card style={{ flex: 1, padding: 10, backgroundColor: C.bg }}><Text style={F.caption}>ATTENDANCE</Text><Text style={{ fontSize: 18, fontWeight: '800', color: C.success }}>{Math.round(students.reduce((a, s) => a + attendanceStats(db, s.id).pct, 0) / students.length)}%</Text></Card>
          <Card style={{ flex: 1, padding: 10, backgroundColor: C.bg }}><Text style={F.caption}>SUBJECTS</Text><Text style={{ fontSize: 18, fontWeight: '800' }}>{cls.subjectIds.length}</Text></Card>
        </Row>
      </Card>


      <SectionHeader title="Students requiring attention" actionLabel="All students" onAction={() => router.push('/teacher/students')} />
      <View style={{ gap: 8 }}>
        {flags.slice(0, 4).map((f) => {
          const s = db.students.find((x) => x.id === f.studentId)!
          const u = db.users.find((x) => x.id === s.userId)!
          return (
            <TouchableOpacity key={f.studentId} onPress={() => router.push(`/teacher/student-detail?studentId=${s.id}`)} activeOpacity={0.8}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderColor: f.level === 'urgent' ? C.danger + '55' : C.warning + '55' }}>
                <Avatar name={u.name} hue={u.avatarHue} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={F.h3}>{u.name}</Text>
                  <Text style={[F.caption, { marginTop: 1, color: f.level === 'urgent' ? C.danger : C.urgent }]} numberOfLines={1}>{f.reasons.join(' · ')}</Text>
                </View>
                <Chip label={f.level} tone={f.level === 'urgent' ? 'bad' : 'warn'} />
              </Card>
            </TouchableOpacity>
          )
        })}
      </View>

      <SectionHeader title="Upcoming assessments" actionLabel="Enter marks" onAction={() => router.push('/teacher/enter-marks')} />
      <View style={{ gap: 8 }}>
        {upcoming.slice(0, 3).map((a) => {
          const subj = db.subjects.find((x) => x.id === a.subjectId)!
          return (
            <Card key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} onPress={() => router.push(`/teacher/assessment-detail?assessmentId=${a.id}`)}>
              <View style={{ width: 8, height: 36, borderRadius: 4, backgroundColor: subj.color }} />
              <View style={{ flex: 1 }}>
                <Text style={F.h3}>{subj.name} · {a.title}</Text>
                <Text style={[F.caption, { marginTop: 2 }]}>{relativeDayLabel(a.date)} · {a.maxMarks} marks</Text>
              </View>
              {a.status === 'scheduled' && a.date < new Date().toISOString().slice(0, 10) ? <Chip label="Marks due" tone="bad" /> : null}
            </Card>
          )
        })}
      </View>

      <SectionHeader title="Students" actionLabel={`View all ${students.length}`} onAction={() => router.push('/teacher/students')} />
      <Card>
        {students.slice(0, 8).map((s, i) => {
          const u = db.users.find((x) => x.id === s.userId)!
          const overall = overallAvg(db, s.id)
          return (
            <TouchableOpacity key={s.id} onPress={() => router.push(`/teacher/student-detail?studentId=${s.id}`)} activeOpacity={0.7}>
              <Row between style={{ paddingVertical: 8, borderBottomWidth: i < Math.min(8, students.length) - 1 ? 1 : 0, borderBottomColor: C.border }}>
                <Row gap={10}>
                  <Avatar name={u.name} hue={u.avatarHue} size={30} />
                  <Text style={[F.body, { fontWeight: '600' }]}>{u.name}</Text>
                </Row>
                <Text style={[F.caption, { fontWeight: '800', color: overall !== null && overall < 55 ? C.danger : C.text2 }]}>{overall !== null ? `${Math.round(overall)}%` : '—'}</Text>
              </Row>
            </TouchableOpacity>
          )
        })}
      </Card>

      <SectionHeader title="Timetable" />
      <Card>
        {[1, 2, 3].map((day) => {
          const entries = db.timetable.filter((t) => t.classId === cls.id && t.day === day)
          return (
            <View key={day} style={{ marginBottom: 6 }}>
              <Text style={[F.micro, { color: C.primary, marginBottom: 3 }]}>{weekdayName(day).toUpperCase()}</Text>
              <Row between style={{ marginBottom: 6 }}>
                <Text style={F.caption}>{entries.length} periods</Text>
                <Text style={F.caption}>{entries.map((e) => db.subjects.find((x) => x.id === e.subjectId)?.short).join(' · ')}</Text>
              </Row>
            </View>
          )
        })}
      </Card>
    </Screen>
  )
}