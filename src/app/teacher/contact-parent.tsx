import React, { useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Btn, Notice, Chip } from '@/components/ui'
import { AIResultView } from '@/components/ai-result-view'
import { useAI } from '@/hooks/use-ai'
import { teacherOf, studentName, attendanceStats, overallAvg, assignmentStats, subjectName, className } from '@/data/stats'

export default function ContactParentScreen() {
  const params = useLocalSearchParams<{ studentId: string }>()
  const { db, user } = useStore()
  const { loading, source, run } = useAI()
  const [draft, setDraft] = useState<Awaited<ReturnType<typeof run>> | null>(null)
  const [sent, setSent] = useState(false)

  const student = db.students.find((s) => s.id === String(params.studentId))
  const teacher = teacherOf(db, user?.id ?? '')
  if (!student) return <Screen><Header title="Contact parent" /><Text>Not found</Text></Screen>

  const links = db.parentLinks.filter((l) => l.studentId === student.id)
  const parents = links.map((l) => db.parents.find((p) => p.id === l.parentId)).filter(Boolean)
  const att = attendanceStats(db, student.id)
  const overall = overallAvg(db, student.id)
  const asg = assignmentStats(db, student.id)

  const generate = async () => {
    const r = await run(db, { kind: 'parent_update', params: { studentId: student.id }, role: 'teacher' })
    setDraft(r)
  }

  const send = () => {
    const parentUserIds = parents.map((p) => p!.userId)
    api.sendNotification(
      parentUserIds,
      `Update from ${user?.name}`,
      draft?.summary ?? '',
      'announcement',
      'medium'
    )
    setSent(true)
  }

  return (
    <Screen scroll>
      <Header title="Contact parent" subtitle={studentName(db, student.id)} />
      <Card>
        <Text style={[F.micro, { marginBottom: 8 }]}>ACADEMIC CONTEXT BEFORE SENDING</Text>
        <Row between style={{ paddingVertical: 5 }}><Text style={F.body2}>Recent performance</Text><Text style={{ fontWeight: '800' }}>{overall !== null ? `${Math.round(overall)}%` : '—'}</Text></Row>
        <Row between style={{ paddingVertical: 5 }}><Text style={F.body2}>Attendance</Text><Text style={{ fontWeight: '800', color: att.pct < 90 ? C.danger : C.success }}>{att.pct}%</Text></Row>
        <Row between style={{ paddingVertical: 5 }}><Text style={F.body2}>Assignments incomplete</Text><Text style={{ fontWeight: '800', color: asg.missing ? C.danger : C.success }}>{asg.missing + asg.pending}</Text></Row>
        {parents.map((p) => {
          const pu = db.users.find((u) => u.id === p!.userId)
          return <Text key={p!.id} style={[F.caption, { marginTop: 8 }]}>To: {pu?.name}</Text>
        })}
      </Card>

      <Card style={{ marginTop: S.md, backgroundColor: C.aiSoft, borderColor: C.ai + '33' }}>
        <Text style={F.h2}>Generate parent update</Text>
        <Text style={[F.body2, { marginTop: 6, lineHeight: 19 }]}>The AI drafts a concise, factual message from the context above. You must review and edit before sending — the AI never sends messages on its own.</Text>
        <Btn label={loading ? 'Drafting…' : 'Generate draft'} variant="ai" onPress={generate} loading={loading} style={{ marginTop: S.md }} />
      </Card>

      {loading ? (
        <Card style={{ marginTop: S.md, alignItems: 'center', paddingVertical: 26 }}>
          <ActivityIndicator size="large" color={C.ai} />
        </Card>
      ) : null}

      {draft ? (
        <View style={{ marginTop: S.md }}>
          <AIResultView result={draft} source={source} sourceNote={source === 'local' ? 'AI service unreachable — built-in analytics engine used.' : undefined} />
          <Card style={{ marginTop: S.md }}>
            <Text style={[F.h3, { color: C.primary }]}>Review checklist</Text>
            <Text style={[F.body2, { marginTop: 4, lineHeight: 18 }]}>· Numbers match the context above · Tone is supportive and factual · No sensitive judgments</Text>
          </Card>
          {sent ? <Notice tone="success">Message sent to parent(s).</Notice> : null}
          <Btn label={sent ? 'Sent ✓' : 'Send to parent(s)'} onPress={send} style={{ marginTop: S.md }} />
        </View>
      ) : null}
    </Screen>
  )
}