import React from 'react'
import { View, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useStore } from '@/data/store'
import { useSelectedChildId } from '@/data/parent-select'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Avatar, Chip, SectionHeader } from '@/components/ui'
import { Icon } from '@/components/icons'
import { parentOf, linkedChildren, overallAvg, gradeFor, attendanceStats } from '@/data/stats'

export default function ParentChildReports() {
  const params = useLocalSearchParams<{ studentId?: string }>()
  const { db, user } = useStore()
  const router = useRouter()
  const parent = parentOf(db, user?.id ?? '')
  const selected = useSelectedChildId()
  if (!parent) return null
  const children = linkedChildren(db, parent.id)
  const active = children.find((c) => c.id === String(params.studentId ?? '')) ?? children.find((c) => c.id === selected) ?? children[0]
  if (!active) return null
  const cu = db.users.find((u) => u.id === active.userId)!
  const overall = overallAvg(db, active.id)
  const att = attendanceStats(db, active.id)
  const reports = db.reports.filter((r) => r.scopeId === active.id || r.type === 'student').reverse()

  return (
    <Screen scroll>
      <Header title="Reports" subtitle={`${cu.name} — ${overall !== null ? gradeFor(overall).grade : ''}`} />
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: S.md }}>
        <Avatar name={cu.name} hue={cu.avatarHue} size={42} />
        <View style={{ flex: 1 }}>
          <Text style={F.h2}>{cu.name}</Text>
          <Text style={[F.caption, { marginTop: 1 }]}>Overall {overall !== null ? Math.round(overall) : '—'}% · Attendance {att.pct}%</Text>
        </View>
        <Chip label="Report card" tone="info" onPress={() => router.push(`/report-card?studentId=${active.id}`)} />
      </Card>

      {children.length > 1 ? (
        <SectionHeader title="Other children" />
      ) : null}
      <View style={{ gap: 8, marginBottom: S.md }}>
        {children.filter((c) => c.id !== active.id).map((c) => {
          const u = db.users.find((x) => x.id === c.userId)!
          return (
            <Card key={c.id} onPress={() => router.push(`/parent/child-reports?studentId=${c.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar name={u.name} hue={u.avatarHue} size={34} />
              <Text style={[F.h3, { flex: 1 }]}>{u.name}</Text>
              <Icon name="chevron" size={15} color={C.text3} />
            </Card>
          )
        })}
      </View>

      <SectionHeader title="Generated reports" />
      <View style={{ gap: 8 }}>
        {reports.slice(0, 8).map((r) => (
          <Card key={r.id} onPress={() => router.push(`/parent/report?id=${r.id}`)}>
            <Row between>
              <View style={{ flex: 1 }}>
                <Text style={F.h3}>{r.title}</Text>
                <Text style={[F.caption, { marginTop: 2 }]}>{r.type} · {r.period}</Text>
              </View>
              <Chip label="View" tone="info" />
            </Row>
          </Card>
        ))}
        {!reports.length ? (
          <Card>
            <Text style={[F.body2, { textAlign: 'center', paddingVertical: 10 }]}>No reports generated yet. Ask your child's teacher for the latest report or check AI insights.</Text>
          </Card>
        ) : null}
      </View>
    </Screen>
  )
}