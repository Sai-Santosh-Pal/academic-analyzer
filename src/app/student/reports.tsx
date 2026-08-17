import React from 'react'
import { View, Text } from 'react-native'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, EmptyState } from '@/components/ui'
import { userOf } from '@/data/stats'
import { formatHuman } from '@/utils/date'

export default function StudentReportsScreen() {
  const { db, user } = useStore()
  if (!user) return null
  const reports = db.reports.filter((r) => r.scopeId === user.id || r.authorId === user.id)

  return (
    <Screen scroll>
      <Header title="Reports" subtitle="AI-generated academic reports" />
      {!reports.length ? (
        <EmptyState icon="file" title="No reports yet" sub="Generate a report from the AI Coach to see it here." />
      ) : null}
      <View style={{ gap: 8 }}>
        {reports.map((r) => {
          let parsed: { title?: string; summary?: string; sections?: { heading: string; points: string[] }[] } | null = null
          try { parsed = JSON.parse(r.content) } catch { /* ignore */ }
          return (
            <Card key={r.id}>
              <Text style={F.h3}>{parsed?.title ?? r.title}</Text>
              <Text style={[F.caption, { marginTop: 3 }]}>{r.type} · {r.period} · {formatHuman(r.createdAt)}</Text>
              {parsed?.summary ? <Text style={[F.body2, { marginTop: 8, lineHeight: 19 }]} numberOfLines={4}>{parsed.summary}</Text> : null}
            </Card>
          )
        })}
      </View>
    </Screen>
  )
}