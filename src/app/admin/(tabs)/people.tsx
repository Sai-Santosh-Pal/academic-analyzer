import React, { useState } from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Avatar, SearchInput, Segmented, Chip, Btn, Notice } from '@/components/ui'
import { Icon } from '@/components/icons'
import { className, subjectName } from '@/data/stats'

export default function AdminPeople() {
  const { db } = useStore()
  const router = useRouter()
  const [tab, setTab] = useState<'students' | 'teachers' | 'parents'>('students')
  const [q, setQ] = useState('')

  const students = db.students
    .map((s) => ({ s, u: db.users.find((x) => x.id === s.userId)! }))
    .filter((x) => x.u.name.toLowerCase().includes(q.toLowerCase()))
  const teachers = db.teachers
    .map((t) => ({ t, u: db.users.find((x) => x.id === t.userId)! }))
    .filter((x) => x.u.name.toLowerCase().includes(q.toLowerCase()))
  const parents = db.parents
    .map((p) => ({ p, u: db.users.find((x) => x.id === p.userId)! }))
    .filter((x) => x.u.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <Screen scroll>
      <Header title="People" subtitle="Students, teachers & parents" />
      {tab === 'teachers' ? (
        <Btn label="+ Add teacher" variant="soft" size="sm" onPress={() => router.push('/admin/add-teacher')} style={{ marginBottom: S.md }} />
      ) : null}
      <Segmented value={tab} onChange={(v) => setTab(v as typeof tab)} options={[{ key: 'students', label: `Students ${students.length}` }, { key: 'teachers', label: `Teachers ${teachers.length}` }, { key: 'parents', label: `Parents ${parents.length}` }]} />
      <View style={{ marginTop: S.md }}>
        <SearchInput value={q} onChange={setQ} placeholder={`Search ${tab}…`} />
      </View>

      <View style={{ marginTop: S.md, gap: 8 }}>
        {tab === 'students' && students.map(({ s, u }) => (
          <Card key={s.id} onPress={() => router.push(`/admin/student-detail?studentId=${s.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={u.name} hue={u.avatarHue} size={38} />
            <View style={{ flex: 1 }}>
              <Text style={F.h3}>{u.name}</Text>
              <Text style={[F.caption, { marginTop: 1 }]}>{className(db, s.classId)} · Roll {s.rollNumber}</Text>
            </View>
            <Icon name="chevron" size={15} color={C.text3} />
          </Card>
        ))}
        {tab === 'teachers' && teachers.map(({ t, u }) => (
          <Card key={t.id} onPress={() => router.push(`/admin/edit-teacher?teacherId=${t.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={u.name} hue={u.avatarHue} size={38} />
            <View style={{ flex: 1 }}>
              <Text style={F.h3}>{u.name}</Text>
              <Text style={[F.caption, { marginTop: 1 }]}>{t.subjectIds.map((sid) => subjectName(db, sid)).join(', ')} · {t.classIds.length} classes</Text>
            </View>
            <Chip label={`Load ${t.workload}`} tone={t.workload > 80 ? 'bad' : 'info'} />
            <Icon name="chevron" size={15} color={C.text3} />
          </Card>
        ))}
        {tab === 'parents' && parents.map(({ p, u }) => (
          <Card key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={u.name} hue={u.avatarHue} size={38} />
            <View style={{ flex: 1 }}>
              <Text style={F.h3}>{u.name}</Text>
              <Text style={[F.caption, { marginTop: 1 }]}>{db.parentLinks.filter((l) => l.parentId === p.id).length} child(ren) linked</Text>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  )
}