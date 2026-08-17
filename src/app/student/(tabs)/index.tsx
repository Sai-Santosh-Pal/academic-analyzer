import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore, useSession, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Card, Ring, Row, SectionHeader, Chip, Avatar, Meter, Btn, AiBadge } from '@/components/ui'
import { Icon } from '@/components/icons'
import { WhatChangedStrip } from '@/components/what-changed'
import { Sparkline } from '@/components/charts'
import {
  studentByUser, overallAvg, attendanceStats, assignmentStats, strengthMap, subjectSeries,
  detectStudentChanges, subjectTrend, upcomingAssessments, classOf, className, studentAssignments,
} from '@/data/stats'
import { todayISO, formatHuman, relativeDayLabel, weekday } from '@/utils/date'
import { userOf } from '@/data/stats'

export default function StudentDashboard() {
  const { db, user } = useStore()
  const router = useRouter()
  const student = studentByUser(db, user?.id ?? '')
  if (!student || !user) return (
    <Screen>
      <View style={{ backgroundColor: C.black, borderRadius: 22, padding: S.lg, marginBottom: S.lg }}>
        <Row between>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' }}>Welcome back</Text>
            <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>{user?.name ?? 'Student'}</Text>
          </View>
          <TouchableOpacity onPress={() => api.logout()} style={{ backgroundColor: 'rgba(255,255,255,0.16)', width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="power" size={17} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </Row>
      </View>
      <Card style={{ borderColor: C.warning + '66', borderWidth: 1 }}>
        <Text style={F.h2}>Account not linked to a class yet</Text>
        <Text style={[F.body2, { marginTop: 6, lineHeight: 19 }]}>
          Your account is ready, but your parent hasn't enrolled you in a class yet. This screen will update automatically once they do.
        </Text>
      </Card>
    </Screen>
  )

  const overall = overallAvg(db, student.id)
  const att = attendanceStats(db, student.id)
  const asg = assignmentStats(db, student.id)
  const strengths = strengthMap(db, student.id)
  const changes = detectStudentChanges(db, student.id)
  const sigChanges = changes.filter((c) => c.significant)
  const cls = classOf(db, student.id)!

  const today = todayISO()
  const wd = weekday(today)
  const todayTT = db.timetable.filter((t) => t.classId === student.classId && t.day === wd).sort((a, b) => a.period - b.period)
  const upcoming = upcomingAssessments(db, student.classId)
  const assignments = studentAssignments(db, student.id).filter((s) => s.status !== 'submitted')
  const topAssign = assignments[0]

  const aiInsight = db.insights.find((i) => i.scope === 'student' && i.scopeId === student.id && i.kind === 'student_investigation' && !i.dismissed)

  return (
    <Screen scroll refresh onRefresh={() => {}}>
      <View style={{ backgroundColor: C.black, borderRadius: 22, padding: S.lg, marginBottom: S.lg }}>
        <Row between>
          <Row gap={12}>
            <Avatar name={user.name} hue={user.avatarHue} size={42} ring />
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' }}>Welcome back</Text>
              <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>{user.name.split(' ')[0]}</Text>
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
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 14 }}>{className(db, student.classId)} · Roll {student.rollNumber} · {cls.academicYear}</Text>
        <Row gap={10} style={{ marginTop: 12 }}>
          <Btn label="Why did this change?" variant="white" size="sm" onPress={() => router.push('/student/what-changed')} />
          <Btn label="Report card" variant="ghost" size="sm" style={{ backgroundColor: 'rgba(255,255,255,0.14)' }} onPress={() => router.push(`/report-card?studentId=${student.id}`)} />
        </Row>
      </View>

      {sigChanges.length ? (
        <View style={{ marginBottom: S.md }}>
          <WhatChangedStrip
            items={sigChanges.slice(0, 3).map((c) => ({
              label: c.subjectName, value: `${c.recent}%`, delta: c.delta,
              color: c.color,
            }))}
          />
        </View>
      ) : null}

      <Row gap={S.md}>
        <Card style={{ flex: 1, alignItems: 'center', paddingVertical: S.lg }}>
          <Ring value={overall ?? 0} size={82} label="OVERALL" sub="performance" />
          <Text style={[F.caption, { marginTop: 6 }]}>vs term average</Text>
        </Card>
        <Card style={{ flex: 1, alignItems: 'center', paddingVertical: S.lg }}>
          <Ring value={att.pct} size={82} label="ATTENDANCE" sub="this term" />
          <Text style={[F.caption, { marginTop: 6 }]}>{att.absent} absent · {att.late} late</Text>
        </Card>
      </Row>

      <SectionHeader title="Subject performance" actionLabel="Details" onAction={() => router.push('/student/performance')} />
      <View style={{ gap: 8 }}>
        {strengths.map((s) => {
          const series = subjectSeries(db, student.id, s.subjectId).map((x) => x.pct)
          const t = subjectTrend(db, student.id, s.subjectId)
          return (
            <TouchableOpacity key={s.subjectId} activeOpacity={0.8} onPress={() => router.push(`/student/subjects?subjectId=${s.subjectId}`)}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
                <View style={{ flex: 1 }}>
                  <Text style={F.h3}>{s.name}</Text>
                  <Text style={[F.caption, { marginTop: 1 }]}>{t.dir === 'improving' ? 'Improving' : t.dir === 'declining' ? 'Declining' : 'Stable'}</Text>
                </View>
                <Sparkline data={series} color={s.color} />
                <View style={{ alignItems: 'flex-end', width: 52 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800' }}>{Math.round(s.avg)}%</Text>
                  {t.delta !== 0 ? <Text style={{ fontSize: 10.5, fontWeight: '800', color: t.delta > 0 ? C.success : C.danger }}>{t.delta > 0 ? '+' : ''}{Math.round(t.delta)}</Text> : null}
                </View>
              </Card>
            </TouchableOpacity>
          )
        })}
      </View>

      {aiInsight ? (
        <View style={{ marginTop: S.md }}>
          <Card style={{ backgroundColor: C.aiSoft, borderColor: C.ai + '33' }} onPress={() => router.push('/student/copilot')}>
            <AiBadge />
            <Text style={[F.h2, { marginTop: 6, color: C.ai }]}>{aiInsight.title}</Text>
            <Text style={[F.body2, { marginTop: 4, lineHeight: 19 }]} numberOfLines={3}>{aiInsight.body}</Text>
            <Text style={[F.caption, { color: C.ai, marginTop: 6, fontWeight: '700' }]}>Open AI Coach →</Text>
          </Card>
        </View>
      ) : null}

      <SectionHeader title="Today's timetable" actionLabel="Full timetable" onAction={() => router.push('/student/timetable')} />
      <Card>
        {todayTT.length ? todayTT.slice(0, 5).map((t) => {
          const subj = db.subjects.find((x) => x.id === t.subjectId)!
          return (
            <Row key={t.id} between style={{ paddingVertical: 8 }}>
              <Row gap={10}>
                <View style={{ width: 52, alignItems: 'center', backgroundColor: C.bg, borderRadius: 8, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: C.text }}>{t.startTime}</Text>
                </View>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: subj.color }} />
                <Text style={[F.body, { fontWeight: '700' }]}>{subj.name}</Text>
              </Row>
            </Row>
          )
        }) : <Text style={[F.body2, { textAlign: 'center', paddingVertical: 10 }]}>No classes today.</Text>}
      </Card>

      {topAssign ? (
        <View style={{ marginTop: S.md }}>
          <SectionHeader title="Next deadline" actionLabel="All assignments" onAction={() => router.push('/student/assignments')} />
          <Card style={{ borderColor: topAssign.assignment.priority === 'high' ? C.danger + '44' : C.border }}>
            <Row between>
              <Row gap={10}>
                <Icon name="clipboard" size={18} color={C.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={F.h3}>{topAssign.assignment.title}</Text>
                  <Text style={[F.caption, { marginTop: 2 }]}>{topAssign.subject.name} · {userOf(db, db.teachers.find((t) => t.id === topAssign.assignment.teacherId)?.userId ?? '')?.name ?? 'Teacher'}</Text>
                </View>
              </Row>
            </Row>
            <Row between style={{ marginTop: S.sm }}>
              <Text style={[F.body2, { color: topAssign.assignment.dueDate < today ? C.danger : C.text2, fontWeight: '700' }]}>
                {topAssign.assignment.dueDate < today ? 'Overdue' : 'Due'} {relativeDayLabel(topAssign.assignment.dueDate)}
              </Text>
              <Btn label="Mark done" variant="soft" size="sm" onPress={() => {}} />
            </Row>
          </Card>
        </View>
      ) : null}

      <SectionHeader title="Upcoming assessments" actionLabel="All" onAction={() => router.push('/student/assessments')} />
      <View style={{ gap: 8 }}>
        {upcoming.slice(0, 3).map((a) => {
          const subj = db.subjects.find((x) => x.id === a.subjectId)!
          return (
            <Card key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: subj.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: subj.color, textAlign: 'center' }}>{formatHuman(a.date).toUpperCase()}</Text>
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

      <SectionHeader title="Academic status" />
      <Card>
        {[
          { label: 'Performance', value: overall ?? 0, color: C.primary },
          { label: 'Attendance', value: att.pct, color: C.success },
          { label: 'Assignments', value: asg.completion, color: C.accent },
          { label: 'Assessment progress', value: 100, color: C.warning },
        ].map((m) => (
          <View key={m.label} style={{ marginBottom: 10 }}>
            <Row between style={{ marginBottom: 5 }}>
              <Text style={F.caption}>{m.label}</Text>
              <Text style={[F.caption, { color: m.color }]}>{Math.round(m.value)}%</Text>
            </Row>
            <Meter value={m.value} color={m.color} />
          </View>
        ))}
        <Text style={[F.caption, { fontSize: 10, marginTop: 4 }]}>Academic status is a summary of school records — it is not a medical or psychological score.</Text>
      </Card>
    </Screen>
  )
}