import React, { useState } from 'react'
import { View, Text } from 'react-native'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Ring, Row, SectionHeader, Chip, Meter } from '@/components/ui'
import { LineChart, Heatmap, BarChart } from '@/components/charts'
import { studentByUser, attendanceStats, attendanceBySubject, monthlyAttendance } from '@/data/stats'
import { schoolDaysBetween, addDays, todayISO } from '@/utils/date'

export default function AttendanceScreen() {
  const { db, user } = useStore()
  const student = studentByUser(db, user?.id ?? '')
  const [weeks, setWeeks] = useState(4)
  if (!student) return null

  const att = attendanceStats(db, student.id)
  const bySubject = attendanceBySubject(db, student.id)
  const monthly = monthlyAttendance(db, student.id)
  const low = att.pct < 85

  const days = schoolDaysBetween(addDays(todayISO(), -weeks * 7), todayISO())
  const dayLabels = days.map((d) => d.slice(8))
  const rowLabels = bySubject.map((s) => s.name.slice(0, 6))
  const values = bySubject.map((s) => days.map((d) => {
    const recs = db.attendance.filter((r) => r.studentId === student.id && r.subjectId === s.subjectId && r.date === d)
    if (!recs.length) return 100
    return Math.round((recs.filter((r) => r.status !== 'absent').length / recs.length) * 100)
  }))

  return (
    <Screen scroll>
      <Header title="Attendance" subtitle="Overall, subject-wise and trends" />
      {low ? (
        <Card style={{ backgroundColor: C.dangerSoft, borderColor: C.danger + '44', marginBottom: S.md }}>
          <Row gap={8}><Text style={{ color: C.danger, fontWeight: '800' }}>!</Text>
            <Text style={[F.body2, { flex: 1 }]}>Attendance is below the 90% benchmark. Missing class is the strongest predictor of declining marks.</Text>
          </Row>
        </Card>
      ) : null}

      <Row gap={S.md}>
        <Card style={{ flex: 1, alignItems: 'center', paddingVertical: S.lg }}>
          <Ring value={att.pct} size={88} label="OVERALL" />
          <Text style={[F.caption, { marginTop: 6 }]}>{att.present} present · {att.absent} absent · {att.late} late</Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={[F.micro, { marginBottom: 8 }]}>BENCHMARK</Text>
          <Row between style={{ marginBottom: 4 }}><Text style={F.caption}>Target</Text><Text style={F.caption}>90%</Text></Row>
          <Meter value={90} color={C.text3} />
          <Row between style={{ marginTop: 10, marginBottom: 4 }}><Text style={F.caption}>You</Text><Text style={[F.caption, { color: low ? C.danger : C.success, fontWeight: '800' }]}>{att.pct}%</Text></Row>
          <Meter value={att.pct} color={low ? C.danger : C.success} />
        </Card>
      </Row>

      <SectionHeader title="Monthly attendance" />
      <Card>
        {monthly.length > 1 ? <LineChart data={monthly.map((m) => m.pct)} labels={monthly.map((m) => m.month.slice(0, 3))} color={C.success} height={140} /> : null}
      </Card>

      <SectionHeader title="Subject-wise attendance" />
      <Card>
        <BarChart horizontal data={bySubject.map((s) => ({ label: s.name, value: s.pct, color: s.color }))} />
      </Card>

      <SectionHeader title="Attendance history" right={<Chip label={`${weeks} wks`} tone="info" />} />
      <Card>
        <Text style={[F.caption, { marginBottom: 10 }]}>Daily % by subject · red = absent-heavy</Text>
        <Heatmap columns={dayLabels} rows={bySubject.map((s) => s.name)} values={values} rowLabels={rowLabels} colLabels={dayLabels} />
      </Card>
    </Screen>
  )
}