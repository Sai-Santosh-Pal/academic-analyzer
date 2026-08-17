import React from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Card, Row, Ring, SectionHeader, Chip, Btn, IconBtn } from '@/components/ui'
import { Icon } from '@/components/icons'
import { BarChart, LineChart, Legend } from '@/components/charts'
import { WhatChangedStrip } from '@/components/what-changed'
import { schoolStats, whatChangedSchool, earlyWarningFlags, subjectPerformanceSchool, className, schoolWideTrend, studentName, teacherWorkload } from '@/data/stats'

export default function AdminDashboard() {
  const { db, user } = useStore()
  const router = useRouter()
  const stats = schoolStats(db)
  const changes = whatChangedSchool(db).filter((c) => Math.abs(c.delta) >= 2).slice(0, 4)
  const flags = earlyWarningFlags(db).slice(0, 6)
  const subjects = subjectPerformanceSchool(db).sort((a, b) => b.avg - a.avg)
  const trend = schoolWideTrend(db)
  const unread = db.notifications.filter((n) => n.userId === user!.id && !n.read).length
  const aiInsight = db.insights.find((i) => i.scope === 'school' && !i.dismissed)
  const emptySchool = db.students.length === 0 && db.teachers.length === 0 && db.classes.length === 0
  const fmtPct = (v: number) => (stats.students ? `${v}%` : '\u2014')
const BLUE_SHADES = ['#0A84FF', 'rgba(10,132,255,0.72)', 'rgba(10,132,255,0.52)', 'rgba(10,132,255,0.36)', 'rgba(10,132,255,0.24)', 'rgba(10,132,255,0.16)', 'rgba(10,132,255,0.1)', '#0066CC']

  return (
    <Screen scroll>
      <LinearGradient colors={['#0066CC', '#0A84FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 22, padding: S.lg, marginBottom: S.lg }}>
        <Row between>
          <Row gap={12}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="school" size={20} color="#fff" />
            </View>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '700' }}>Administrator</Text>
              <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>{user!.name}</Text>
            </View>
          </Row>
          <Row gap={6}>
            <Chip label="Admin" tone="info" />
            <Btn label="School report" variant="white" size="sm" onPress={() => router.push('/admin/reports')} />
            <IconBtn onPress={() => api.logout()} tone="rgba(255,255,255,0.16)">
              <Icon name="power" size={16} color="#fff" strokeWidth={2} />
            </IconBtn>
          </Row>
        </Row>
        <Row between style={{ marginTop: 16 }}>
          <View>
            <Text style={{ color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: -1 }}>{fmtPct(stats.avgPerformance)}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '700' }}>avg performance</Text>
          </View>
          <View style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <View>
            <Text style={{ color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: -1 }}>{fmtPct(stats.avgAttendance)}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '700' }}>avg attendance</Text>
          </View>
          <View style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <View>
            <Text style={{ color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: -1 }}>{stats.flaggedStudents}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '700' }}>flagged students</Text>
          </View>
        </Row>
      </LinearGradient>

      {db.students.length === 0 && db.teachers.length === 0 ? (
        <Card style={{ marginTop: S.md, borderColor: C.primary + '44', borderWidth: 1 }}>
          <Text style={F.h2}>Your school is all set up</Text>
          <Text style={[F.body2, { marginTop: 4, lineHeight: 19 }]}>
            Add teachers and classes to start tracking academics, attendance and interventions.
          </Text>
          <Row gap={S.sm} style={{ marginTop: S.md }}>
            <Btn label="Add teacher" size="sm" onPress={() => router.push('/admin/add-teacher')} />
            <Btn label="Set up classes" variant="soft" size="sm" onPress={() => router.push('/admin/classes')} />
          </Row>
        </Card>
      ) : null}

      {emptySchool ? null : (
        <>
          {changes.length ? (
            <WhatChangedStrip
              title="WHAT CHANGED AT SCHOOL"
              items={changes.slice(0, 3).map((c) => ({
                label: c.className, value: `${Math.round(c.avg)}%`, delta: Math.round(c.delta),
                sub: c.dir === 'declining' ? 'Watch closely' : c.dir === 'improving' ? 'Improving' : 'Stable',
                color: c.delta < 0 ? C.danger : c.delta > 0 ? C.success : C.text3,
              }))}
            />
          ) : null}

          <SectionHeader title="School overview" />
          <Card>
            <LineChart data={trend.map((w) => w.pct)} labels={trend.map((w) => w.week.slice(5))} color={C.primary} height={140} />
            <Text style={[F.caption, { marginTop: 6 }]}>Average assessment score by week</Text>
          </Card>

          <Row gap={S.md} style={{ marginTop: S.md }}>
            <Card style={{ flex: 1, alignItems: 'center', paddingVertical: S.md }}>
              <Ring value={stats.avgAttendance} size={86} label="ATTENDANCE" color={C.success} />
            </Card>
            <Card style={{ flex: 1, alignItems: 'center', paddingVertical: S.md }}>
              <Ring value={stats.avgAssignmentCompletion} size={86} label="HW DONE" color={C.info} />
            </Card>
          </Row>

          {aiInsight ? (
            <Card style={{ marginTop: S.md, backgroundColor: C.aiSoft, borderColor: C.ai + '33' }} onPress={() => router.push('/admin/more')}>
              <Text style={[F.h2, { color: C.ai }]}>{aiInsight.title}</Text>
              <Text style={[F.body2, { marginTop: 4, lineHeight: 19 }]} numberOfLines={3}>{aiInsight.body}</Text>
              <Text style={[F.caption, { color: C.ai, marginTop: 6, fontWeight: '700' }]}>Open AI intelligence →</Text>
            </Card>
          ) : null}

          <SectionHeader title="Subject health" />
          <Card>
            <BarChart data={subjects.map((s, i) => ({ label: s.name.slice(0, 4), value: s.avg, color: BLUE_SHADES[i % BLUE_SHADES.length] }))} height={150} />
            <Legend items={subjects.map((s, i) => ({ label: s.name, color: BLUE_SHADES[i % BLUE_SHADES.length], value: `${s.avg}%` }))} />
          </Card>

          <SectionHeader title="Students needing attention" />
          <View style={{ gap: 8 }}>
            {flags.map((f) => {
              const st = db.students.find((x) => x.id === f.studentId)!
              return (
                <Card key={f.studentId} onPress={() => router.push(`/admin/student-detail?studentId=${f.studentId}`)}>
                  <Row between>
                    <View style={{ flex: 1 }}>
                      <Text style={F.h3}>{studentName(db, f.studentId)}</Text>
                      <Text style={[F.caption, { marginTop: 2 }]}>{className(db, st.classId)}</Text>
                    </View>
                    <Chip label={f.reasons.join(' · ').slice(0, 34)} tone={f.level === 'urgent' ? 'bad' : 'warn'} />
                  </Row>
                  {f.suggestion ? <Text style={[F.caption, { marginTop: 6, color: C.text2 }]} numberOfLines={2}>{f.suggestion}</Text> : null}
                </Card>
              )
            })}
            {!flags.length ? <Card><Text style={[F.body2, { textAlign: 'center', paddingVertical: 8 }]}>No students currently flagged. Well done!</Text></Card> : null}
          </View>

          <SectionHeader title="Teacher workload" />
          <Card>
            {teacherWorkload(db).slice(0, 5).map((t) => (
              <Row key={t.teacherId} between style={{ paddingVertical: 6 }}>
                <Text style={[F.body2, { flex: 1 }]}>{t.name}</Text>
                <Text style={[F.caption, { width: 60 }]}>{t.classes} classes</Text>
                <Text style={[F.caption, { width: 70, textAlign: 'right' }]}>{t.students} students</Text>
              </Row>
            ))}
          </Card>
        </>
      )}
    </Screen>
  )
}