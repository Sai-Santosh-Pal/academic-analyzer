import React, { useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Btn, AiBadge } from '@/components/ui'
import { Icon, IconName } from '@/components/icons'
import { AIResultView } from '@/components/ai-result-view'
import { useAI } from '@/hooks/use-ai'
import { studentByUser } from '@/data/stats'

const ACTIONS: { key: string; label: string; icon: IconName; color: string; soft: string }[] = [
  { key: 'analyze_test', label: 'Analyse my last test', icon: 'target', color: C.primary, soft: C.primarySoft },
  { key: 'explain_weak', label: 'Explain my weakest topic', icon: 'book', color: C.accent, soft: C.accentSoft },
  { key: 'recovery_plan', label: 'Build my recovery plan', icon: 'flag', color: C.success, soft: C.successSoft },
  { key: 'study_today', label: 'What should I study today?', icon: 'calendar', color: C.warning, soft: C.warningSoft },
  { key: 'prepare_next', label: 'Prepare for my next assessment', icon: 'zap', color: C.ai, soft: C.aiSoft },
  { key: 'compare_progress', label: 'Compare my progress', icon: 'trend', color: C.primary, soft: C.primarySoft },
]

export default function CopilotScreen() {
  const { db, user } = useStore()
  const { loading, source, run } = useAI()
  const [result, setResult] = useState<Awaited<ReturnType<typeof run>> | null>(null)
  const [active, setActive] = useState('')

  const student = studentByUser(db, user?.id ?? '')
  if (!student) return null

  const act = async (key: string, label: string) => {
    setActive(label)
    setResult(null)
    const r = await run(db, { kind: 'copilot', params: { studentId: student.id, action: key }, role: 'student' })
    setResult(r)
  }

  return (
    <Screen scroll>
      <Header title="Academic copilot" subtitle="Contextual actions, not a generic chatbot" />
      <Card style={{ backgroundColor: C.aiSoft, borderColor: C.ai + '33' }}>
        <AiBadge />
        <Text style={[F.body2, { marginTop: 6, lineHeight: 19 }]}>
          Choose an action. Each one analyses your actual marks, attendance and assignments — the AI only explains what the data shows.
        </Text>
      </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: S.md }}>
        {ACTIONS.map((a) => (
          <Card key={a.key} style={{ width: '47.5%', padding: 12, backgroundColor: a.soft, borderColor: 'transparent' }} onPress={() => act(a.key, a.label)}>
            <Icon name={a.icon} size={19} color={a.color} />
            <Text style={[F.h3, { fontSize: 12.5, marginTop: 8, lineHeight: 16, color: a.color === C.ai ? C.ai : C.text }]}>{a.label}</Text>
          </Card>
        ))}
      </View>

      {loading ? (
        <Card style={{ marginTop: S.md, alignItems: 'center', paddingVertical: 30 }}>
          <ActivityIndicator size="large" color={C.ai} />
          <Text style={[F.body2, { marginTop: 12 }]}>{active}…</Text>
        </Card>
      ) : null}

      {result ? (
        <View style={{ marginTop: S.md }}>
          <AIResultView result={result} source={source} sourceNote={source === 'local' ? 'AI service unreachable — built-in analytics engine used.' : undefined} />
          <Btn label="Ask again" variant="soft" onPress={() => setResult(null)} style={{ marginTop: S.md }} />
        </View>
      ) : null}
    </Screen>
  )
}