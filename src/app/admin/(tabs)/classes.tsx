import React from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, SectionHeader, Chip, Btn } from '@/components/ui'
import { schoolStats } from '@/data/stats'

export default function AdminClasses() {
  const { db } = useStore()
  const router = useRouter()
  const stats = schoolStats(db)

  return (
    <Screen scroll>
      <Header title="Classes" subtitle={`${stats.classes} classes · ${stats.students} students`} />
      <Btn label="+ New class" variant="soft" size="sm" onPress={() => router.push('/admin/class-editor')} style={{ marginBottom: S.md }} />
      <View style={{ gap: 8 }}>
        {db.classes.map((c) => {
          const students = db.students.filter((s) => s.classId === c.id)
          const cts = db.teachers.filter((t) => t.classTeacherOfIds.includes(c.id))
          const ctu = cts[0] ? db.users.find((u) => u.id === cts[0].userId) : null
          return (
            <Card key={c.id} onPress={() => router.push(`/admin/class-detail?classId=${c.id}`)}>
              <Row between>
                <View style={{ flex: 1 }}>
                  <Text style={F.h2}>{c.name} {c.section}</Text>
                  <Text style={[F.caption, { marginTop: 2 }]}>
                    {students.length} students · {c.subjectIds.length} subjects{ctu ? ` · Class teacher: ${ctu.name}` : ''}
                  </Text>
                </View>
                <Row gap={6}>
                  <Chip label={c.academicYear.slice(0, 4)} tone="info" />
                  <Btn label="Edit" variant="soft" size="sm" onPress={() => router.push(`/admin/class-editor?classId=${c.id}`)} />
                </Row>
              </Row>
              <Row gap={6} style={{ marginTop: S.sm, flexWrap: 'wrap' }}>
                {c.subjectIds.map((sid) => {
                  const subj = db.subjects.find((x) => x.id === sid)!
                  return <Chip key={sid} label={subj.name} tone="neutral" />
                })}
              </Row>
            </Card>
          )
        })}
      </View>

      <SectionHeader title="Enrolment health" />
      <Card>
        {db.classes.map((c) => {
          const n = db.students.filter((s) => s.classId === c.id).length
          const max = 40
          return (
            <View key={c.id} style={{ marginBottom: 10 }}>
              <Row between style={{ marginBottom: 4 }}>
                <Text style={[F.body2, { fontWeight: '700' }]}>{c.name} {c.section}</Text>
                <Text style={F.caption}>{n}/{max}</Text>
              </Row>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: C.bg, overflow: 'hidden' }}>
                <View style={{ width: `${Math.min((n / max) * 100, 100)}%`, height: '100%', borderRadius: 4, backgroundColor: n / max > 0.9 ? C.warning : C.primary }} />
              </View>
            </View>
          )
        })}
      </Card>
    </Screen>
  )
}