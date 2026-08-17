import React, { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, Avatar, Btn, Notice } from '@/components/ui'
import { Icon } from '@/components/icons'
import { teacherOf, className } from '@/data/stats'
import { todayISO } from '@/utils/date'
import { AttendanceStatus } from '@/data/types'

const STATUS_ORDER: AttendanceStatus[] = ['present', 'absent', 'late']

export default function MarkAttendanceScreen() {
  const params = useLocalSearchParams<{ classId?: string }>()
  const { db, user } = useStore()
  const router = useRouter()
  const teacher = teacherOf(db, user?.id ?? '')
  const [classId, setClassId] = useState(params.classId ?? '')
  const [subjectId, setSubjectId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [period, setPeriod] = useState('1')
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({})
  const [saved, setSaved] = useState(false)

  if (!teacher) return (
    <Screen>
      <Header title="Mark attendance" />
      <Card>
        <Text style={F.body2}>Your account could not be found in the school roster yet.</Text>
      </Card>
    </Screen>
  )
  const myClasses = db.classes.filter((c) => teacher.classTeacherOfIds.includes(c.id))
  const cls = db.classes.find((c) => c.id === classId)
  const subjects = cls?.subjectIds.map((sid) => db.subjects.find((x) => x.id === sid)!).filter(Boolean) ?? []
  const activeSubject = subjectId || subjects[0]?.id || ''
  const students = cls ? db.students.filter((s) => s.classId === cls.id) : []

  const prefill = () => {
    const next: Record<string, AttendanceStatus> = {}
    for (const s of students) {
      const existing = db.attendance.find((a) => a.studentId === s.id && a.subjectId === activeSubject && a.date === date && a.period === Number(period))
      next[s.id] = existing?.status ?? 'present'
    }
    setStatuses(next)
  }
  React.useEffect(prefill, [classId, activeSubject, date, period, students.length])

  const setAll = (st: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {}
    for (const s of students) next[s.id] = st
    setStatuses(next)
  }

  const save = () => {
    const records = students.map((s) => ({
      studentId: s.id, classId, subjectId: activeSubject, date, period: Number(period), status: statuses[s.id] ?? 'present',
    }))
    api.markAttendance(records, teacher.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const counts = {
    present: students.filter((s) => (statuses[s.id] ?? 'present') === 'present').length,
    absent: students.filter((s) => (statuses[s.id] ?? 'present') === 'absent').length,
    late: students.filter((s) => (statuses[s.id] ?? 'present') === 'late').length,
  }

  return (
    <Screen scroll>
      <Header title="Mark attendance" subtitle="Class → Subject → Date → Period" />
      {myClasses.length === 0 ? (
        <Notice tone="warn">
          Only class teachers can mark attendance. Your school hasn't assigned you as the class teacher of any class yet — ask your administrator to set this up.
        </Notice>
      ) : null}
      {myClasses.length === 0 ? null : (
        <>
      <Card>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {myClasses.map((c) => <Chip key={c.id} label={`${c.name} ${c.section}`} tone={classId === c.id ? 'info' : 'neutral'} onPress={() => { setClassId(c.id); setSaved(false) }} selected={classId === c.id} />)}
        </Row>
        {cls ? (
          <>
            <View style={{ height: 1, backgroundColor: C.border, marginVertical: S.md }} />
            <Text style={[F.caption, { marginBottom: 6 }]}>SUBJECT</Text>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {subjects.map((s) => <Chip key={s.id} label={s.name} tone={activeSubject === s.id ? 'info' : 'neutral'} onPress={() => { setSubjectId(s.id); setSaved(false) }} selected={activeSubject === s.id} />)}
            </Row>
            <Row gap={S.md} style={{ marginTop: S.md }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: C.bg, borderRadius: 12, padding: 10, borderWidth: 1.5, borderColor: C.border }}>
                <Text style={[F.caption, { marginBottom: 4 }]}>DATE</Text>
                <Text style={{ fontWeight: '800' }}>{date}</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[F.caption, { marginBottom: 4 }]}>PERIOD</Text>
                <Row gap={6}>
                  {['1', '2', '3', '4', '5', '6'].map((p) => (
                    <TouchableOpacity key={p} onPress={() => { setPeriod(p); setSaved(false) }} style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: period === p ? C.primary : C.bg, alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: period === p ? '#fff' : C.text2 }}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </Row>
              </View>
            </Row>
          </>
        ) : (
          <Notice tone="warn">Select a class to begin.</Notice>
        )}
      </Card>

      {cls ? (
        <>
          <Row gap={8} style={{ marginTop: S.md }}>
            <TouchableOpacity onPress={() => setAll('present')} style={{ flex: 1, backgroundColor: C.successSoft, borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ color: C.success, fontWeight: '800', fontSize: 13 }}>Mark all present</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAll('late')} style={{ flex: 1, backgroundColor: C.warningSoft, borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ color: C.urgent, fontWeight: '800', fontSize: 13 }}>Mark all late</Text>
            </TouchableOpacity>
          </Row>

          <Card style={{ marginTop: S.md }}>
            <Row between style={{ marginBottom: S.sm }}>
              <Text style={F.h3}>{students.length} students</Text>
              <Row gap={6}>
                <Chip label={`✓ ${counts.present}`} tone="good" />
                <Chip label={`✗ ${counts.absent}`} tone="bad" />
                <Chip label={`~ ${counts.late}`} tone="warn" />
              </Row>
            </Row>
            {students.map((s) => {
              const u = db.users.find((x) => x.id === s.userId)!
              const st = statuses[s.id] ?? 'present'
              return (
                <Row key={s.id} between style={{ paddingVertical: 7 }}>
                  <Row gap={10} style={{ flex: 1 }}>
                    <Avatar name={u.name} hue={u.avatarHue} size={30} />
                    <View>
                      <Text style={[F.body, { fontWeight: '600' }]}>{u.name}</Text>
                      <Text style={[F.caption, { fontSize: 10 }]}>Roll {s.rollNumber}</Text>
                    </View>
                  </Row>
                  <Row gap={5}>
                    {STATUS_ORDER.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => { setStatuses((prev) => ({ ...prev, [s.id]: opt })); setSaved(false) }}
style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: st === opt ? (opt === 'present' ? C.success : opt === 'absent' ? C.danger : C.warning) : C.bg }}
                        >
                        <Text style={{ fontSize: 11, fontWeight: '800', color: st === opt ? (opt === 'late' ? '#000' : '#fff') : C.text3 }}>{opt === 'present' ? 'P' : opt === 'absent' ? 'A' : 'L'}</Text>
                      </TouchableOpacity>
                    ))}
                  </Row>
                </Row>
              )
            })}
          </Card>

          {saved ? <Notice tone="success" >Attendance saved — student and parent dashboards updated automatically.</Notice> : null}
          <Btn label="Save attendance" onPress={save} style={{ marginTop: S.md }} />
        </>
      ) : null}
        </>
      )}
    </Screen>
  )
}