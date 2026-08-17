import React, { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Avatar, Row, SearchInput, Segmented, Chip, Btn } from '@/components/ui'
import { Icon } from '@/components/icons'
import { teacherOf, teacherStudents, attendanceStats, overallAvg, earlyWarningFlags, classOf, className } from '@/data/stats'

type SortKey = 'all' | 'attention' | 'improving' | 'declining'

export default function TeacherStudents() {
  const { db, user } = useStore()
  const router = useRouter()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('all')
  const [classFilter, setClassFilter] = useState<string>('')
  const teacher = teacherOf(db, user?.id ?? '')
  if (!teacher) return null

  const students = teacherStudents(db, teacher.id)
  const flags = earlyWarningFlags(db)
  const flagged = new Set(flags.map((f) => f.studentId))
  const classes = db.classes.filter((c) => teacher.classIds.includes(c.id))

  const list = students
    .filter((s) => (classFilter ? s.classId === classFilter : true))
    .map((s) => {
      const u = db.users.find((x) => x.id === s.userId)!
      const att = attendanceStats(db, s.id)
      const overall = overallAvg(db, s.id)
      const flag = flags.find((f) => f.studentId === s.id)
      const strength = s.performanceProfile
      return { s, u, att, overall, flag, strength }
    })
    .filter((x) => q ? x.u.name.toLowerCase().includes(q.toLowerCase()) : true)
    .filter((x) => sort === 'all' ? true : sort === 'attention' ? !!x.flag : x.strength === sort)
    .sort((a, b) => (a.flag ? 0 : 1) - (b.flag ? 0 : 1))

  return (
    <Screen scroll>
      <Header title="Students" subtitle={`${students.length} in your classes`} />
      <SearchInput value={q} onChange={setQ} placeholder="Search students…" />
      <View style={{ marginTop: S.sm }}>
        <Segmented<SortKey>
          options={[{ key: 'all', label: 'All' }, { key: 'attention', label: 'Attention' }, { key: 'improving', label: 'Improving' }, { key: 'declining', label: 'Declining' }]}
          value={sort}
          onChange={setSort}
        />
      </View>
      <Btn label="+ Add student" variant="soft" size="sm" onPress={() => router.push('/teacher/add-student')} style={{ marginTop: S.md }} />
      <Btn label="+ Invite parent" variant="soft" size="sm" onPress={() => router.push('/teacher/add-parent')} style={{ marginTop: S.sm }} />
      <Row gap={8} style={{ marginTop: S.sm, flexWrap: 'wrap' }}>
        <Chip label="All classes" tone={!classFilter ? 'info' : 'neutral'} onPress={() => setClassFilter('')} selected={!classFilter} />
        {classes.map((c) => <Chip key={c.id} label={`${c.name} ${c.section}`} tone={classFilter === c.id ? 'info' : 'neutral'} onPress={() => setClassFilter(c.id)} selected={classFilter === c.id} />)}
      </Row>

      <View style={{ marginTop: S.md, gap: 8 }}>
        {list.map(({ s, u, att, overall, flag, strength }) => (
          <TouchableOpacity key={s.id} activeOpacity={0.8} onPress={() => router.push(`/teacher/student-detail?studentId=${s.id}`)}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderColor: flag ? (flag.level === 'urgent' ? C.danger + '55' : C.warning + '55') : C.border }}>
              <Avatar name={u.name} hue={u.avatarHue} size={40} />
              <View style={{ flex: 1 }}>
                <Row between>
                  <Text style={F.h3}>{u.name}</Text>
                  {flag ? <Chip label={flag.level === 'urgent' ? 'URGENT' : 'FLAG'} tone={flag.level === 'urgent' ? 'bad' : 'warn'} /> : null}
                </Row>
                <Text style={[F.caption, { marginTop: 1 }]}>
                  {className(db, s.classId)} · Roll {s.rollNumber} · att {att.pct}% · {overall !== null ? `avg ${Math.round(overall)}%` : 'no marks'}
                </Text>
              </View>
              <Icon name="chevron" size={16} color={C.text3} />
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </Screen>
  )
}