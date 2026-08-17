import React, { useState } from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, SectionHeader, EmptyState, Btn } from '@/components/ui'
import { DonutChart, Legend, LineChart, BarChart } from '@/components/charts'
import { WhatChangedStrip } from '@/components/what-changed'
import { teacherOf, classPulse, classAverage, classSubjectAverage, whatChangedClass, assessmentSubjectTrend, attendanceStats, studentName, className } from '@/data/stats'
import { teacherStudents } from '@/data/stats'

export default function TeacherAnalytics() {
  const { db, user } = useStore()
  const router = useRouter()
  const teacher = teacherOf(db, user?.id ?? '')
  const [classId, setClassId] = useState('')
  if (!teacher) return null
  const myClasses = db.classes.filter((c) => teacher.classIds.includes(c.id))
  const cid = classId || myClasses[0]?.id
  if (!cid) return <Screen><Header title="Analytics" /><EmptyState icon="trend" title="No classes" /></Screen>
  const cls = db.classes.find((c) => c.id === cid)!

  const pulse = classPulse(db, cid)
  const subjects = classSubjectAverage(db, cid)
  const changed = whatChangedClass(db, cid)
  const students = teacherStudents(db, teacher.id).filter((s) => s.classId === cid)
  const lowAtt = students.filter((s) => attendanceStats(db, s.id).pct < 88)

  return (
    <Screen scroll>
      <Header title="Class analytics" subtitle={`${cls.name} ${cls.section}`} />
      <Row gap={8} style={{ flexWrap: 'wrap', marginBottom: S.md }}>
        {myClasses.map((c) => <Chip key={c.id} label={`${c.name} ${c.section}`} tone={cid === c.id ? 'info' : 'neutral'} onPress={() => setClassId(c.id)} selected={cid === c.id} />)}
      </Row>

      <WhatChangedStrip
        title="WHAT CHANGED · CLASS"
        items={changed.map((c) => ({ label: c.name, value: `${Math.round(c.avg)}%`, delta: c.delta, sub: `class average`, color: c.color }))}
      />

      <SectionHeader title="Class pulse" />
      <Card style={{ alignItems: 'center' }}>
        <DonutChart
          size={150}
          thickness={22}
          centerValue={`${pulse.avg}%`}
          centerLabel="CLASS AVG"
          segments={[
            { value: pulse.improving, color: C.success, label: 'Improving' },
            { value: pulse.stable, color: C.accent, label: 'Stable' },
            { value: pulse.declining, color: C.danger, label: 'Declining' },
          ]}
        />
        <Text style={[F.h3, { marginTop: 6 }]}>{students.length} students</Text>
        <Legend items={[{ label: 'Improving', color: C.success, value: String(pulse.improving) }, { label: 'Stable', color: C.accent, value: String(pulse.stable) }, { label: 'Declining', color: C.danger, value: String(pulse.declining) }]} />
      </Card>


      <SectionHeader title="Subject comparison" />
      <Card>
        <BarChart data={subjects.map((s) => ({ label: s.name.slice(0, 6), value: s.avg, color: s.color }))} height={160} />
      </Card>

      <SectionHeader title="Assessment trends" />
      <Card>
        {cls.subjectIds.slice(0, 3).map((sid) => {
          const subj = db.subjects.find((x) => x.id === sid)!
          const trend = assessmentSubjectTrend(db, cid, sid)
          if (trend.length < 2) return null
          return (
            <View key={sid} style={{ marginBottom: S.md }}>
              <Text style={[F.caption, { color: subj.color, fontWeight: '800', marginBottom: 4 }]}>{subj.name} — class average</Text>
              <LineChart data={trend.map((t) => t.avg)} labels={trend.map((t) => t.title.split(' ')[0])} color={subj.color} height={110} />
            </View>
          )
        })}
      </Card>

      <SectionHeader title="Attendance overview" />
      <Card>
        <Row between style={{ marginBottom: S.sm }}>
          <Text style={F.body2}>Students below 88% attendance</Text>
          <Chip label={String(lowAtt.length)} tone={lowAtt.length ? 'warn' : 'good'} />
        </Row>
        {lowAtt.slice(0, 5).map((s) => (
          <Row key={s.id} between style={{ paddingVertical: 5 }}>
            <Text style={F.body2}>{studentName(db, s.id)}</Text>
            <Text style={[F.caption, { color: C.danger, fontWeight: '800' }]}>{attendanceStats(db, s.id).pct}%</Text>
          </Row>
        ))}
      </Card>

      <Btn label="Generate class report" variant="soft" onPress={() => router.push('/teacher/reports?classId=' + cid)} style={{ marginTop: S.md }} />
    </Screen>
  )
}