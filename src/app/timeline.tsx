import React from 'react'
import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card } from '@/components/ui'
import { Icon, IconName } from '@/components/icons'
import { academicTimeline, studentByUser } from '@/data/stats'
import { formatHuman } from '@/utils/date'

const KIND_META: Record<string, { icon: IconName; color: string; soft: string }> = {
  assessment: { icon: 'target', color: C.primary, soft: C.primarySoft },
  assignment: { icon: 'clipboard', color: C.accent, soft: C.accentSoft },
  attendance: { icon: 'user', color: C.success, soft: C.successSoft },
  intervention: { icon: 'flag', color: C.ai, soft: C.aiSoft },
  shift: { icon: 'alert', color: C.danger, soft: C.dangerSoft },
  result: { icon: 'check', color: C.success, soft: C.successSoft },
  notification: { icon: 'bell', color: C.text2, soft: C.bg },
}

export default function TimelineScreen() {
  const { db, user } = useStore()
  const params = useLocalSearchParams<{ studentId?: string }>()
  const me = studentByUser(db, user?.id ?? '')
  const studentId = params.studentId ?? me?.id
  if (!studentId || !user) {
    return <Screen><Header title="Academic timeline" /><Text style={[F.body2, { textAlign: 'center', marginTop: 40 }]}>Timeline is available from a student context.</Text></Screen>
  }
  const events = academicTimeline(db, studentId)

  const groups: { date: string; items: typeof events }[] = []
  for (const e of events) {
    const last = groups[groups.length - 1]
    if (last && last.date === e.date) last.items.push(e)
    else groups.push({ date: e.date, items: [e] })
  }

  return (
    <Screen scroll>
      <Header title="Academic timeline" subtitle="How academic events relate over time" />
      <Card style={{ backgroundColor: C.primarySoft, borderColor: C.primary + '30' }}>
        <Text style={[F.h3, { color: C.primary }]}>COLLECT → DETECT → EXPLAIN → ACT → MEASURE</Text>
        <Text style={[F.caption, { marginTop: 4 }]}>Every assessment, shift, intervention and follow-up result, in one place.</Text>
      </Card>
      <View style={{ marginTop: S.lg, paddingLeft: 6 }}>
        {groups.map((g, gi) => (
          <View key={g.date} style={{ flexDirection: 'row' }}>
            <View style={{ alignItems: 'center', width: 26 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary, marginTop: 22 }} />
              {gi < groups.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: C.border, marginTop: 4 }} /> : null}
            </View>
            <View style={{ flex: 1, marginLeft: 8, paddingBottom: S.lg }}>
              <Text style={[F.micro, { color: C.primary, fontSize: 11, marginBottom: 6 }]}>{formatHuman(g.date, { weekday: true })}</Text>
              {g.items.map((e) => {
                const meta = KIND_META[e.kind]
                return (
                  <Card key={e.id} style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: meta.soft, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={meta.icon} size={15} color={meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[F.h3, { fontSize: 13.5 }]}>{e.title}</Text>
                      <Text style={[F.caption, { marginTop: 2 }]}>{e.detail}</Text>
                    </View>
                  </Card>
                )
              })}
            </View>
          </View>
        ))}
      </View>
    </Screen>
  )
}