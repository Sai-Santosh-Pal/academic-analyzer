import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Card, Row, SectionHeader, Chip, Avatar, Btn, AiBadge } from '@/components/ui'
import { Icon } from '@/components/icons'
import { WhatChangedStrip } from '@/components/what-changed'
import { teacherOf, classPulse, classAverage, className, teacherStudents, earlyWarningFlags, attendanceStats, teacherName } from '@/data/stats'
import { todayISO, weekday, relativeDayLabel } from '@/utils/date'

export default function TeacherDashboard() {
  const { db, user } = useStore()
  const router = useRouter()
  const teacher = teacherOf(db, user?.id ?? '')
  if (!teacher || !user) return (
    <Screen>
      <View style={{ backgroundColor: C.black, borderRadius: 22, padding: S.lg, marginBottom: S.lg }}>
        <Row between>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' }}>Teacher workspace</Text>
            <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>{user?.name ?? 'Teacher'}</Text>
          </View>
          <TouchableOpacity onPress={() => api.logout()} style={{ backgroundColor: 'rgba(255,255,255,0.16)', width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="power" size={17} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </Row>
      </View>
      <Card style={{ borderColor: C.warning + '66', borderWidth: 1 }}>
        <Text style={F.h2}>No classes assigned yet</Text>
        <Text style={[F.body2, { marginTop: 6, lineHeight: 19 }]}>
          Your account is ready, but the school hasn't assigned you to any classes yet. Ask your administrator to assign classes — this screen will update automatically.
        </Text>
      </Card>
    </Screen>
  )

  const today = todayISO()
  const wd = weekday(today)
  const myTT = db.timetable.filter((t) => t.teacherId === teacher.id && t.day === wd).sort((a, b) => a.period - b.period)
  const myStudents = teacherStudents(db, teacher.id)
  const flags = earlyWarningFlags(db).filter((f) => teacher.classIds.includes(myStudents.find((s) => s.id === f.studentId)?.classId ?? ''))
  const pendingMarks = db.assessments.filter((a) => a.teacherId === teacher.id && a.status === 'scheduled' && a.date < today)
  const upcoming = db.assessments.filter((a) => a.teacherId === teacher.id && a.status === 'scheduled' && a.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4)
  const myClasses = db.classes.filter((c) => teacher.classIds.includes(c.id))
  const pulse = myClasses.map((c) => ({ cls: c, pulse: classPulse(db, c.id) }))

  return (
    <Screen scroll refresh onRefresh={() => {}}>
      <View style={{ backgroundColor: C.black, borderRadius: 22, padding: S.lg, marginBottom: S.lg }}>
        <Row between>
          <Row gap={12}>
            <Avatar name={user.name} hue={user.avatarHue} size={42} ring />
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' }}>Teacher workspace</Text>
              <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>{user.name}</Text>
            </View>
          </Row>
          <Row gap={8}>
            <TouchableOpacity onPress={() => router.push('/notifications')} style={{ backgroundColor: 'rgba(255,255,255,0.16)', width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bell" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => api.logout()} style={{ backgroundColor: 'rgba(255,255,255,0.16)', width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="power" size={17} color="#fff" strokeWidth={2} />
            </TouchableOpacity>
          </Row>
        </Row>
        <Row gap={10} style={{ marginTop: 12 }}>
          {((teacher.classTeacherOfIds ?? []).length > 0) ? (
            <Btn label="Mark attendance" variant="white" size="sm" onPress={() => router.push('/teacher/mark-attendance')} />
          ) : (
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Attendance is marked by class teachers only.</Text>
          )}
          <Btn label="AI tools" variant="ghost" size="sm" style={{ backgroundColor: 'rgba(255,255,255,0.14)' }} onPress={() => router.push('/teacher/ai-tools')} />
        </Row>
      </View>

      <WhatChangedStrip
        title="WHAT CHANGED THIS WEEK"
        items={myClasses.slice(0, 3).map((c) => ({
          label: `${c.name} ${c.section}`, value: `${Math.round(classAverage(db, c.id) ?? 0)}%`,
          delta: Math.round((classAverage(db, c.id) ?? 0) - (classPulse(db, c.id).avg ?? 0)),
          sub: `${classPulse(db, c.id).improving} improving · ${classPulse(db, c.id).declining} declining`, color: C.primary,
        }))}
      />

      <SectionHeader title="Classes taught" actionLabel="All classes" onAction={() => router.push('/teacher/classes')} />
      <View style={{ gap: 8 }}>
        {myClasses.map((c) => {
          const p = classPulse(db, c.id)
          return (
            <TouchableOpacity key={c.id} activeOpacity={0.8} onPress={() => router.push(`/teacher/class-detail?classId=${c.id}`)}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: C.accent }}>{c.name}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={F.h3}>{c.name} {c.section} · {c.academicYear}</Text>
                  <Text style={[F.caption, { marginTop: 2 }]}>{myStudents.filter((s) => s.classId === c.id).length} students · avg {p.avg}%</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <Chip label={`↑${p.improving}`} tone="good" />
                  <Chip label={`↓${p.declining}`} tone="bad" />
                </View>
                <Icon name="chevron" size={16} color={C.text3} />
              </Card>
            </TouchableOpacity>
          )
        })}
      </View>

      <SectionHeader title="Students requiring attention" actionLabel="See all" onAction={() => router.push('/teacher/students')} />
      <View style={{ gap: 8 }}>
        {flags.slice(0, 3).map((f) => {
          const s = db.students.find((x) => x.id === f.studentId)!
          const u = db.users.find((x) => x.id === s.userId)!
          return (
            <TouchableOpacity key={f.studentId} activeOpacity={0.8} onPress={() => router.push(`/teacher/student-detail?studentId=${s.id}`)}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderColor: f.level === 'urgent' ? C.danger + '55' : C.warning + '55' }}>
                <Avatar name={u.name} hue={u.avatarHue} size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={F.h3}>{u.name}</Text>
                  <Text style={[F.caption, { marginTop: 2, color: f.level === 'urgent' ? C.danger : C.urgent }]} numberOfLines={1}>{f.reasons.join(' · ')}</Text>
                </View>
                <Chip label={f.level === 'urgent' ? 'URGENT' : 'ATTENTION'} tone={f.level === 'urgent' ? 'bad' : 'warn'} />
              </Card>
            </TouchableOpacity>
          )
        })}
        {!flags.length ? <Card><Text style={F.body2}>No students currently flagged.</Text></Card> : null}
      </View>

      <SectionHeader title="Today's timetable" />
      <Card>
        {myTT.length ? myTT.map((t) => {
          const subj = db.subjects.find((x) => x.id === t.subjectId)!
          return (
            <Row key={t.id} between style={{ paddingVertical: 8 }}>
              <Row gap={10}>
                <View style={{ width: 52, alignItems: 'center', backgroundColor: C.bg, borderRadius: 8, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800' }}>{t.startTime}</Text>
                </View>
                <Text style={[F.body, { fontWeight: '700' }]}>{subj.name}</Text>
              </Row>
              <Text style={F.caption}>{className(db, t.classId)}</Text>
            </Row>
          )
        }) : <Text style={[F.body2, { textAlign: 'center', paddingVertical: 10 }]}>No classes today.</Text>}
      </Card>

      {pendingMarks.length ? (
        <View style={{ marginTop: S.md }}>
          <SectionHeader title="Marking pending" />
          <Card style={{ backgroundColor: C.warningSoft, borderColor: C.warning + '44' }}>
            <Row between>
              <Text style={[F.h3, { color: C.urgent }]}>{pendingMarks.length} assessment(s) awaiting marks</Text>
              <Btn label="Enter marks" variant="warning" size="sm" onPress={() => router.push(`/teacher/enter-marks?assessmentId=${pendingMarks[0].id}`)} />
            </Row>
          </Card>
        </View>
      ) : null}

      <SectionHeader title="Upcoming assessments" />
      <View style={{ gap: 8 }}>
        {upcoming.map((a) => {
          const subj = db.subjects.find((x) => x.id === a.subjectId)!
          return (
            <Card key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: subj.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 9, fontWeight: '900', color: subj.color, textAlign: 'center' }}>{relativeDayLabel(a.date).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={F.h3}>{subj.name} · {a.title}</Text>
                <Text style={[F.caption, { marginTop: 2 }]}>{className(db, a.classId)} · {a.maxMarks} marks</Text>
              </View>
            </Card>
          )
        })}
      </View>

      {pulse.length ? (
        <View style={{ marginTop: S.md }}>
          <SectionHeader title="AI class insight" />
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/teacher/ai-tools')}>
            <Card style={{ backgroundColor: C.aiSoft, borderColor: C.ai + '33' }}>
              <AiBadge />
              <Text style={[F.h3, { marginTop: 6, color: C.ai }]}>Pulse of your classes</Text>
              <Text style={[F.body2, { marginTop: 4, lineHeight: 18 }]}>
                {pulse.map((p) => `${p.cls.name} ${p.cls.section}: ${p.pulse.improving} improving / ${p.pulse.declining} declining`).join(' · ')}. Run a full AI class analysis to get topic-level recommendations.
              </Text>
              <Text style={[F.caption, { color: C.ai, marginTop: 6, fontWeight: '700' }]}>Open AI tools →</Text>
            </Card>
          </TouchableOpacity>
        </View>
      ) : null}
    </Screen>
  )
}