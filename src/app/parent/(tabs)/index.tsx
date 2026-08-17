import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore, api } from '@/data/store'
import { useSelectedChildId } from '@/data/parent-select'
import { C, F, S } from '@/theme'
import { Screen, Card, Row, Ring, SectionHeader, Chip, Avatar, AiBadge, Btn } from '@/components/ui'
import { Icon } from '@/components/icons'
import { ChildSwitcher } from '@/components/child-switcher'
import { WhatChangedStrip } from '@/components/what-changed'
import { parentOf, linkedChildren, classOf, overallAvg, attendanceStats, assignmentStats, strengthMap, detectStudentChanges, upcomingAssessments, subjectTrend, className, gradeFor, studentName } from '@/data/stats'
import { relativeDayLabel, weekday } from '@/utils/date'

export default function ParentDashboard() {
  const { db, user } = useStore()
  const router = useRouter()
  const parent = parentOf(db, user?.id ?? '')
  const selected = useSelectedChildId()
  if (!parent || !user) return (
    <Screen>
      <View style={{ backgroundColor: C.black, borderRadius: 22, padding: S.lg, marginBottom: S.lg }}>
        <Row between>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' }}>Parent view</Text>
            <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>{user?.name ?? 'Parent'}</Text>
          </View>
          <TouchableOpacity onPress={() => api.logout()} style={{ backgroundColor: 'rgba(255,255,255,0.16)', width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="power" size={17} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </Row>
      </View>
      <Card style={{ borderColor: C.warning + '66', borderWidth: 1 }}>
        <Text style={F.h2}>No children linked yet</Text>
        <Text style={[F.body2, { marginTop: 6, lineHeight: 19 }]}>
          Your account is ready, but no child is linked to you yet. Ask the school to link your child's account — this screen will update automatically.
        </Text>
      </Card>
    </Screen>
  )
  const children = linkedChildren(db, parent.id)
  const child = children.find((c) => c.id === selected) ?? children[0]
  if (!child) return (
    <Screen>
      <View style={{ backgroundColor: C.black, borderRadius: 22, padding: S.lg, marginBottom: S.lg }}>
        <Row between>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' }}>Parent view</Text>
            <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>{user?.name ?? 'Parent'}</Text>
          </View>
          <TouchableOpacity onPress={() => api.logout()} style={{ backgroundColor: 'rgba(255,255,255,0.16)', width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="power" size={17} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </Row>
      </View>
      <Card style={{ borderColor: C.warning + '66', borderWidth: 1 }}>
        <Text style={F.h2}>No children linked yet</Text>
        <Text style={[F.body2, { marginTop: 6, lineHeight: 19 }]}>
          Your account is ready, but no child is linked to you yet. Ask the school to link your child's account — this screen will update automatically.
        </Text>
      </Card>
    </Screen>
  )

  const cu = db.users.find((x) => x.id === child.userId)!
  const cls = classOf(db, child.id)!
  const overall = overallAvg(db, child.id)
  const att = attendanceStats(db, child.id)
  const asg = assignmentStats(db, child.id)
  const strengths = strengthMap(db, child.id)
  const changes = detectStudentChanges(db, child.id)
  const sig = changes.filter((c) => c.significant)
  const upcoming = upcomingAssessments(db, child.classId).slice(0, 3)
  const wd = weekday(new Date().toISOString().slice(0, 10))
  const todayTT = db.timetable.filter((t) => t.classId === child.classId && t.day === wd).slice(0, 4)
  const unread = db.notifications.filter((n) => n.userId === user!.id && !n.read).length
  const aiInsight = db.insights.find((i) => i.scope === 'student' && i.scopeId === child.id && i.kind === 'weekly_summary' && !i.dismissed)

  return (
    <Screen scroll>
      <View style={{ backgroundColor: C.black, borderRadius: 22, padding: S.lg, marginBottom: S.lg }}>
        <Row between>
          <Row gap={12}>
            <Avatar name={user!.name} hue={user!.avatarHue} size={42} ring />
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' }}>Parent view</Text>
              <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>{user!.name}</Text>
            </View>
          </Row>
          <Row gap={8}>
            <TouchableOpacity onPress={() => router.push('/notifications')} style={{ backgroundColor: 'rgba(255,255,255,0.16)', width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 2 }}>
              <Icon name="bell" size={17} color="#fff" />
              {unread ? <View style={{ backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, position: 'absolute', top: -4, right: -6 }}><Text style={{ fontSize: 9, fontWeight: '900', color: C.danger }}>{unread}</Text></View> : null}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => api.logout()} style={{ backgroundColor: 'rgba(255,255,255,0.16)', width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="power" size={17} color="#fff" strokeWidth={2} />
            </TouchableOpacity>
          </Row>
        </Row>
        <Btn label="Open child reports" variant="white" size="sm" onPress={() => router.push('/parent/child-reports')} style={{ alignSelf: 'flex-start', marginTop: 14 }} />
      </View>

      {children.length > 1 ? (
        <View style={{ marginBottom: S.md }}>
          <ChildSwitcher />
        </View>
      ) : null}

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: S.md }}>
        <Avatar name={cu.name} hue={cu.avatarHue} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={F.h2}>{cu.name}</Text>
          <Text style={[F.caption, { marginTop: 1 }]}>{cls ? `${cls.name} ${cls.section}` : ''} · {cls?.academicYear}</Text>
        </View>
        <Chip label={`Grade ${gradeFor(overall ?? 0).grade}`} tone="info" />
      </Card>

      {sig.length ? (
        <View style={{ marginBottom: S.md }}>
          <WhatChangedStrip
            title="WHAT CHANGED"
            items={sig.slice(0, 3).map((c) => ({
              label: c.subjectName, value: `${c.recent}%`, delta: c.delta,
              color: c.color,
            }))}
          />
        </View>
      ) : null}

      <Row gap={S.md}>
        <Card style={{ flex: 1, alignItems: 'center', paddingVertical: S.lg }}>
          <Ring value={overall ?? 0} size={80} label="PERFORMANCE" />
        </Card>
        <Card style={{ flex: 1, alignItems: 'center', paddingVertical: S.lg }}>
          <Ring value={att.pct} size={80} label="ATTENDANCE" color={att.pct >= 90 ? C.success : C.warning} />
        </Card>
      </Row>

      <SectionHeader title="Recent marks" actionLabel="Progress" onAction={() => router.push('/parent/performance')} />
      <Card>
        {strengths.map((s) => {
          const t = subjectTrend(db, child.id, s.subjectId)
          return (
            <Row key={s.subjectId} between style={{ paddingVertical: 7 }}>
              <Row gap={8}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
                <Text style={F.body2}>{s.name}</Text>
              </Row>
              <Row gap={8}>
                <Text style={{ fontWeight: '800' }}>{Math.round(s.avg)}%</Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: t.dir === 'improving' ? C.success : t.dir === 'declining' ? C.danger : C.text3 }}>
                  {t.dir === 'improving' ? '↑' : t.dir === 'declining' ? '↓' : '→'} {t.delta >= 0 ? '+' : ''}{Math.round(t.delta)}
                </Text>
              </Row>
            </Row>
          )
        })}
      </Card>

      {aiInsight ? (
        <View style={{ marginTop: S.md }}>
          <Card style={{ backgroundColor: C.aiSoft, borderColor: C.ai + '33' }} onPress={() => router.push('/parent/ai')}>
            <AiBadge />
            <Text style={[F.h2, { marginTop: 6, color: C.ai }]}>{aiInsight.title}</Text>
            <Text style={[F.body2, { marginTop: 4, lineHeight: 19 }]} numberOfLines={3}>{aiInsight.body}</Text>
            <Text style={[F.caption, { color: C.ai, marginTop: 6, fontWeight: '700' }]}>Open AI insights →</Text>
          </Card>
        </View>
      ) : null}

      <SectionHeader title="Upcoming assessments" />
      <View style={{ gap: 8 }}>
        {upcoming.map((a) => {
          const subj = db.subjects.find((x) => x.id === a.subjectId)!
          return (
            <Card key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 8, height: 36, borderRadius: 4, backgroundColor: subj.color }} />
              <View style={{ flex: 1 }}>
                <Text style={F.h3}>{subj.name} · {a.title}</Text>
                <Text style={[F.caption, { marginTop: 2 }]}>{relativeDayLabel(a.date)}</Text>
              </View>
              <Chip label="Upcoming" tone="info" />
            </Card>
          )
        })}
      </View>

      <SectionHeader title="Today's timetable" />
      <Card>
        {todayTT.map((t) => {
          const subj = db.subjects.find((x) => x.id === t.subjectId)!
          return (
            <Row key={t.id} between style={{ paddingVertical: 7 }}>
              <Row gap={8}><Text style={[F.caption, { fontWeight: '800' }]}>{t.startTime}</Text><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: subj.color }} /><Text style={F.body2}>{subj.name}</Text></Row>
            </Row>
          )
        })}
        {!todayTT.length ? <Text style={[F.body2, { textAlign: 'center', paddingVertical: 8 }]}>No classes today.</Text> : null}
      </Card>

      <SectionHeader title="To discuss" />
      <Card>
        {asg.missing + asg.pending > 0 ? (
          <Row gap={8} style={{ paddingVertical: 6 }}>
            <Icon name="clipboard" size={16} color={C.warning} />
            <Text style={[F.body2, { flex: 1 }]}>{asg.missing + asg.pending} assignment(s) pending or missing</Text>
          </Row>
        ) : (
          <Row gap={8} style={{ paddingVertical: 6 }}>
            <Icon name="check" size={16} color={C.success} />
            <Text style={[F.body2, { flex: 1 }]}>All assignments completed on time</Text>
          </Row>
        )}
        {att.pct < 90 ? (
          <Row gap={8} style={{ paddingVertical: 6 }}>
            <Icon name="alert" size={16} color={C.danger} />
            <Text style={[F.body2, { flex: 1 }]}>Attendance below the 90% benchmark</Text>
          </Row>
        ) : null}
      </Card>
    </Screen>
  )
}