import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, Btn } from '@/components/ui'
import { Icon } from '@/components/icons'
import { teacherOf, classPulse, classAverage, teacherStudents, className } from '@/data/stats'

export default function TeacherClasses() {
  const { db, user } = useStore()
  const router = useRouter()
  const teacher = teacherOf(db, user?.id ?? '')
  if (!teacher) return null
  const myClasses = db.classes.filter((c) => teacher.classIds.includes(c.id))

  return (
    <Screen scroll>
      <Header
        title="My classes"
        right={<Btn label="Mark attendance" variant="soft" size="sm" onPress={() => router.push('/teacher/mark-attendance')} />}
      />
      <View style={{ gap: 10 }}>
        {myClasses.map((c) => {
          const p = classPulse(db, c.id)
          const students = teacherStudents(db, teacher.id).filter((s) => s.classId === c.id)
          const subjects = c.subjectIds.map((sid) => db.subjects.find((x) => x.id === sid)!).filter(Boolean)
          return (
            <TouchableOpacity key={c.id} activeOpacity={0.85} onPress={() => router.push(`/teacher/class-detail?classId=${c.id}`)}>
              <Card>
                <Row between>
                  <Row gap={12}>
                    <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: C.accent }}>{c.name}</Text>
                    </View>
                    <View>
                      <Text style={F.h2}>Class {c.name} {c.section}</Text>
                      <Text style={[F.caption, { marginTop: 2 }]}>{c.academicYear} · {students.length} students</Text>
                    </View>
                  </Row>
                  <Chip label={`avg ${p.avg}%`} tone={p.avg >= 70 ? 'good' : 'warn'} />
                </Row>
                <Row style={{ marginTop: S.sm }} gap={6}>
                  <Chip label={`↑ ${p.improving} improving`} tone="good" />
                  <Chip label={`→ ${p.stable} stable`} tone="info" />
                  <Chip label={`↓ ${p.declining} declining`} tone="bad" />
                </Row>
                <Row gap={6} style={{ marginTop: S.sm, flexWrap: 'wrap' }}>
                  {subjects.map((s) => (
                    <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.color }} />
                      <Text style={[F.caption, { fontSize: 10.5 }]}>{s.name}</Text>
                    </View>
                  ))}
                </Row>
              </Card>
            </TouchableOpacity>
          )
        })}
      </View>
    </Screen>
  )
}