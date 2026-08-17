import React, { useState } from 'react'
import { View, Text, TextInput, Modal, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, Btn, Notice, SectionHeader } from '@/components/ui'
import { Icon } from '@/components/icons'
import { weekdayName } from '@/utils/date'

const DAYS = [0, 1, 2, 3, 4, 5]

export default function ClassTimetableScreen() {
  const params = useLocalSearchParams<{ classId: string }>()
  const { db } = useStore()
  const router = useRouter()
  const cls = db.classes.find((c) => c.id === String(params.classId))
  const [day, setDay] = useState(0)
  const [editing, setEditing] = useState<{ period: number } | null>(null)

  const [subjectId, setSubjectId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('09:40')

  if (!cls) return <Screen><Header title="Timetable" /><Text style={{ padding: S.lg }}>Class not found.</Text></Screen>

  const entries = db.timetable.filter((t) => t.classId === cls.id && t.day === day).sort((a, b) => a.period - b.period)
  const maxPeriod = Math.max(0, ...entries.map((e) => e.period))

  const openEditor = (period: number) => {
    const existing = db.timetable.find((t) => t.classId === cls.id && t.day === day && t.period === period)
    setSubjectId(existing?.subjectId ?? '')
    setTeacherId(existing?.teacherId ?? '')
    setStart(existing?.startTime ?? '09:00')
    setEnd(existing?.endTime ?? '09:40')
    setEditing({ period })
  }

  const saveSlot = () => {
    if (!editing || !subjectId) return
    const existing = db.timetable.find((t) => t.classId === cls.id && t.day === day && t.period === editing.period)
    const patch = { subjectId, teacherId, startTime: start, endTime: end }
    if (existing) api.updateTimetableEntry(existing.id, patch)
    else api.addTimetableEntry({ classId: cls.id, day, period: editing.period, ...patch })
    setEditing(null)
  }

  const deleteSlot = () => {
    if (!editing) return
    const existing = db.timetable.find((t) => t.classId === cls.id && t.day === day && t.period === editing.period)
    if (existing) api.deleteTimetableEntry(existing.id)
    setEditing(null)
  }

  const teacherUsers = db.teachers.map((t) => ({ t, u: db.users.find((x) => x.id === t.userId)! }))
  const classSubjects = cls.subjectIds.map((sid) => db.subjects.find((x) => x.id === sid)!).filter(Boolean)

  return (
    <Screen scroll>
      <Header title={`${cls.name} ${cls.section} — timetable`} subtitle={`${db.timetable.filter((t) => t.classId === cls.id).length} periods scheduled`} />

      <Row gap={8} style={{ marginBottom: S.md, flexWrap: 'wrap' }}>
        {DAYS.map((d) => (
          <Chip key={d} label={weekdayName(d).slice(0, 3)} tone={day === d ? 'info' : 'neutral'} onPress={() => setDay(d)} selected={day === d} />
        ))}
      </Row>

      <SectionHeader title={`${weekdayName(day)}`} />
      <Card style={{ paddingHorizontal: 0, overflow: 'hidden' }}>
        {Array.from({ length: Math.max(maxPeriod, 6) }, (_, i) => i + 1).map((p) => {
          const e = db.timetable.find((t) => t.classId === cls.id && t.day === day && t.period === p)
          const subj = e ? db.subjects.find((x) => x.id === e.subjectId) : null
          const tu = e ? teacherUsers.find((x) => x.t.id === e.teacherId) : null
          return (
            <Pressable key={p} onPress={() => openEditor(p)} style={{ paddingHorizontal: S.lg, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 46 }}>
                <Text style={[F.caption, { fontWeight: '900' }]}>P{p}</Text>
                {e ? <Text style={[F.micro, { fontSize: 9 }]}>{e.startTime}</Text> : null}
              </View>
              {subj ? <View style={{ width: 8, height: 34, borderRadius: 4, backgroundColor: subj.color }} /> : <View style={{ width: 8, height: 34, borderRadius: 4, backgroundColor: C.bg }} />}
              <View style={{ flex: 1 }}>
                <Text style={[F.body2, { fontWeight: '700' }]}>{e ? subj!.name : `Period ${p} — tap to assign`}</Text>
                <Text style={[F.micro, { fontSize: 9.5, marginTop: 1 }]}>{e ? (tu?.u?.name ?? '—') : ''}</Text>
              </View>
              <Icon name="chevron" size={14} color={C.text3} />
            </Pressable>
          )
        })}
      </Card>

      <Btn label="Generate with AI" variant="soft" onPress={() => router.push(`/admin/ai-timetable?classId=${cls.id}`)} style={{ marginTop: S.md }} />

      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', padding: S.xl }} onPress={() => setEditing(null)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: 20, padding: S.lg, maxHeight: '85%' }}>
            <Text style={F.h2}>{weekdayName(day)} · Period {editing?.period}</Text>

            <Text style={[F.caption, { marginTop: S.md, marginBottom: 6 }]}>SUBJECT</Text>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {classSubjects.map((s) => (
                <Chip key={s.id} label={s.name} tone={subjectId === s.id ? 'info' : 'neutral'} onPress={() => setSubjectId(s.id)} selected={subjectId === s.id} />
              ))}
              {!classSubjects.length ? <Text style={F.caption}>No subjects in this class — edit the class first.</Text> : null}
            </Row>

            <Text style={[F.caption, { marginTop: S.md, marginBottom: 6 }]}>TEACHER</Text>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {teacherUsers
                .filter(({ t }) => !subjectId || t.subjectIds.includes(subjectId))
                .map(({ t, u }) => (
                  <Chip key={t.id} label={u.name} tone={teacherId === t.id ? 'good' : 'neutral'} onPress={() => setTeacherId(t.id)} selected={teacherId === t.id} />
                ))}
              {!teacherUsers.length ? <Text style={F.caption}>No teachers yet — add one from People first.</Text> : null}
            </Row>

            <Row gap={S.md} style={{ marginTop: S.md }}>
              <View style={{ flex: 1 }}>
                <Text style={[F.caption, { marginBottom: 6 }]}>STARTS</Text>
                <TextInput value={start} onChangeText={setStart} placeholder="09:00" placeholderTextColor={C.text3} style={{ borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, backgroundColor: '#fff' }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[F.caption, { marginBottom: 6 }]}>ENDS</Text>
                <TextInput value={end} onChangeText={setEnd} placeholder="09:40" placeholderTextColor={C.text3} style={{ borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, backgroundColor: '#fff' }} />
              </View>
            </Row>

            <Row gap={S.md} style={{ marginTop: S.md }}>
              {db.timetable.some((t) => t.classId === cls.id && t.day === day && t.period === editing?.period) ? (
                <Btn label="Delete" variant="danger" style={{ flex: 1 }} onPress={deleteSlot} />
              ) : null}
              <Btn label="Save period" style={{ flex: 1 }} onPress={saveSlot} disabled={!subjectId} />
            </Row>
            <Btn label="Cancel" variant="outline" style={{ marginTop: S.sm }} onPress={() => setEditing(null)} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  )
}