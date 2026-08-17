import React, { useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Btn, Field, Input, Row, Chip, Notice } from '@/components/ui'
import { AIResultView } from '@/components/ai-result-view'
import { useAI } from '@/hooks/use-ai'
import { studentByUser } from '@/data/stats'

export default function ReportScreen() {
  const { db, user } = useStore()
  const { loading, source, run } = useAI()
  const [result, setResult] = useState<Awaited<ReturnType<typeof run>> | null>(null)
  const [instructions, setInstructions] = useState('')
  const [period, setPeriod] = useState('Term 1 · 2026–27')
  const [saved, setSaved] = useState(false)

  const student = studentByUser(db, user?.id ?? '')
  if (!student) return null

  const generate = async () => {
    setSaved(false)
    const r = await run(db, { kind: 'report', params: { reportType: 'student', scopeId: student.id, period }, role: 'student' })
    setResult(r)
    if (r) {
      api.saveReport({ type: 'student', title: r.title, scopeId: student.id, period, content: JSON.stringify(r), authorId: user!.id })
      setSaved(true)
    }
  }

  return (
    <Screen scroll>
      <Header title="Generate a report" subtitle="Student academic report" />
      <Card>
        <Field label="Period">
          <Input value={period} onChangeText={setPeriod} />
        </Field>
        <Field label="Additional instructions (optional)">
          <Input value={instructions} onChangeText={setInstructions} placeholder="e.g. Focus on Mathematics and study habits" multiline />
        </Field>
        <Btn label={loading ? 'Generating…' : 'Generate report'} onPress={generate} loading={loading} variant="ai" />
      </Card>

      {saved ? <Notice tone="success" >Report saved to your reports list.</Notice> : null}

      {loading ? (
        <Card style={{ marginTop: S.md, alignItems: 'center', paddingVertical: 30 }}>
          <ActivityIndicator size="large" color={C.ai} />
          <Text style={[F.body2, { marginTop: 12 }]}>Writing your report…</Text>
        </Card>
      ) : null}

      {result ? (
        <View style={{ marginTop: S.md }}>
          <AIResultView result={result} source={source} sourceNote={source === 'local' ? 'AI service unreachable — built-in analytics engine used.' : undefined} />
        </View>
      ) : null}
    </Screen>
  )
}