import React, { useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useStore, api } from '@/data/store'
import { useSelectedChildId } from '@/data/parent-select'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Btn, Row, Chip, Notice, AiBadge, SectionHeader } from '@/components/ui'
import { AIResultView } from '@/components/ai-result-view'
import { useAI } from '@/hooks/use-ai'
import { ChildSwitcher } from '@/components/child-switcher'
import { parentOf, linkedChildren } from '@/data/stats'

export default function ParentAI() {
  const { db, user } = useStore()
  const { loading, source, run } = useAI()
  const [result, setResult] = useState<Awaited<ReturnType<typeof run>> | null>(null)
  const parent = parentOf(db, user?.id ?? '')
  const selected = useSelectedChildId()
  if (!parent) return null
  const children = linkedChildren(db, parent.id)
  const child = (children.find((c) => c.id === selected) ?? children[0])
  if (!child) return null

  const saved = db.insights.filter((i) => i.scope === 'student' && i.scopeId === child.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const weekly = async () => {
    setResult(null)
    const r = await run(db, { kind: 'weekly_summary', params: { studentId: child.id }, role: 'parent' })
    setResult(r)
    if (r) api.saveInsight({ scope: 'student', scopeId: child.id, kind: 'weekly_summary', title: r.title, body: r.summary, data: {} })
  }

  const report = async () => {
    setResult(null)
    const r = await run(db, { kind: 'parent_report', params: { studentId: child.id }, role: 'parent' })
    setResult(r)
  }

  return (
    <Screen scroll>
      <Header title="AI insights" subtitle="Weekly summaries, progress questions & reports" />
      {children.length > 1 ? (
        <View style={{ marginBottom: S.md }}>
          <ChildSwitcher />
        </View>
      ) : null}

      <Card style={{ backgroundColor: C.aiSoft, borderColor: C.ai + '33' }}>
        <AiBadge />
        <Text style={[F.h2, { marginTop: 6, color: C.ai }]}>What does the AI do here?</Text>
        <Text style={[F.body2, { marginTop: 6, lineHeight: 19 }]}>Summarises marks, attendance and assignments into plain-language updates — always generated from real data, always reviewed by your child's teachers before it reaches you.</Text>
      </Card>

      <Row gap={S.md} style={{ marginTop: S.md }}>
        <Card style={{ flex: 1, alignItems: 'center' }} onPress={weekly}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: C.ai }}>1</Text>
          <Text style={[F.h3, { marginTop: 4 }]}>Weekly summary</Text>
          <Text style={[F.caption, { textAlign: 'center', marginTop: 3 }]}>This week's highs, dips & focus areas</Text>
        </Card>
        <Card style={{ flex: 1, alignItems: 'center' }} onPress={report}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: C.ai }}>2</Text>
          <Text style={[F.h3, { marginTop: 4 }]}>Progress report</Text>
          <Text style={[F.caption, { textAlign: 'center', marginTop: 3 }]}>Full structured parent report</Text>
        </Card>
      </Row>

      {loading ? (
        <Card style={{ marginTop: S.md, alignItems: 'center', paddingVertical: 26 }}>
          <ActivityIndicator size="large" color={C.ai} />
          <Text style={[F.body2, { marginTop: 10 }]}>Analysing recent activity…</Text>
        </Card>
      ) : null}
      {result ? (
        <View style={{ marginTop: S.md }}>
          <AIResultView result={result} source={source} sourceNote={source === 'local' ? 'AI service unreachable — built-in analytics engine used.' : undefined} />
        </View>
      ) : null}

      {saved.length ? (
        <>
          <SectionHeader title="Saved summaries" />
          <View style={{ gap: 8 }}>
            {saved.slice(0, 4).map((i) => (
              <Card key={i.id}>
                <Text style={[F.h3, { fontSize: 13.5 }]}>{i.title}</Text>
                <Text style={[F.caption, { marginTop: 2 }]}>{i.createdAt.slice(0, 10)}</Text>
                <Text style={[F.body2, { marginTop: 4, lineHeight: 18 }]} numberOfLines={3}>{i.body}</Text>
              </Card>
            ))}
          </View>
        </>
      ) : null}

      <Notice tone="info">AI insights are always grounded in verified school data and are reviewed by teachers before reaching you.</Notice>
    </Screen>
  )
}