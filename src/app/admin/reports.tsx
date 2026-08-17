import React, { useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, Btn, SectionHeader, Notice } from '@/components/ui'
import { AIResultView } from '@/components/ai-result-view'
import { useAI } from '@/hooks/use-ai'
import { schoolStats, teacherWorkload, schoolWideTrend } from '@/data/stats'

export default function AdminReports() {
  const { db, user } = useStore()
  const { loading, source, run } = useAI()
  const [result, setResult] = useState<Awaited<ReturnType<typeof run>> | null>(null)
  const [period, setPeriod] = useState('Term 1 · 2026–27')
  const stats = schoolStats(db)

  const generate = async () => {
    setResult(null)
    const r = await run(db, { kind: 'school_intelligence', params: { period }, role: 'admin' })
    setResult(r)
    if (r) api.saveReport({ type: 'school', title: r.title, scopeId: 'school', period, content: JSON.stringify(r), authorId: user!.id })
  }

  const saved = db.reports.filter((r) => r.type === 'school').reverse()

  return (
    <Screen scroll>
      <Header title="School reports" subtitle="AI school intelligence reports" />

      <Card style={{ backgroundColor: C.aiSoft, borderColor: C.ai + '33' }}>
        <Text style={[F.h2, { color: C.ai }]}>School intelligence report</Text>
        <Text style={[F.body2, { marginTop: 6, lineHeight: 19 }]}>
          Aggregates {stats.students} students, {stats.teachers} teachers and {stats.classes} classes into one structured report for the board and parents' association.
        </Text>
        <Btn label={loading ? 'Generating…' : 'Generate school intelligence report'} variant="ai" onPress={generate} loading={loading} style={{ marginTop: S.md }} />
      </Card>

      {loading ? (
        <Card style={{ marginTop: S.md, alignItems: 'center', paddingVertical: 26 }}>
          <ActivityIndicator size="large" color={C.ai} />
          <Text style={[F.body2, { marginTop: 10 }]}>Compiling school-wide intelligence…</Text>
        </Card>
      ) : null}
      {result ? (
        <View style={{ marginTop: S.md }}>
          <AIResultView result={result} source={source} sourceNote={source === 'local' ? 'AI service unreachable — built-in analytics engine used.' : undefined} />
        </View>
      ) : null}

      <SectionHeader title="Previously generated" />
      <View style={{ gap: 8 }}>
        {saved.slice(0, 6).map((r) => (
          <Card key={r.id}>
            <Text style={[F.h3, { fontSize: 13.5 }]}>{r.title}</Text>
            <Text style={[F.caption, { marginTop: 2 }]}>{r.period} · {r.createdAt.slice(0, 10)}</Text>
          </Card>
        ))}
        {!saved.length ? <Card><Text style={[F.body2, { textAlign: 'center', paddingVertical: 8 }]}>No reports generated yet.</Text></Card> : null}
      </View>
    </Screen>
  )
}