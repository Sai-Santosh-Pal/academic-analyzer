import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, AiBadge, Btn } from '@/components/ui'
import { Icon, IconName } from '@/components/icons'
import { studentByUser, overallAvg, attendanceStats } from '@/data/stats'

const FEATURES: { key: string; title: string; desc: string; icon: IconName; route: string; color: string; soft: string }[] = [
  { key: 'investigate', title: 'Performance investigator', desc: 'Why did my performance change? Full cause analysis.', icon: 'search', route: '/student/what-changed', color: C.primary, soft: C.primarySoft },
  { key: 'plan', title: 'Study plan generator', desc: 'Daily plan from your available hours and exam date.', icon: 'calendar', route: '/student/study-plan', color: C.accent, soft: C.accentSoft },
  { key: 'copilot', title: 'Academic copilot', desc: 'Analyse a test, explain a topic, build a recovery plan…', icon: 'sparkle', route: '/student/copilot', color: C.ai, soft: C.aiSoft },
  { key: 'whatif', title: 'What-if scenarios', desc: 'Estimate study allocations — clearly labelled estimates.', icon: 'trend', route: '/student/study-plan?mode=whatif', color: C.warning, soft: C.warningSoft },
  { key: 'report', title: 'Generate a report', desc: 'Student report with summary, strengths and recommendations.', icon: 'file', route: '/student/report', color: C.success, soft: C.successSoft },
]

export default function StudentCoach() {
  const { db, user } = useStore()
  const router = useRouter()
  const student = studentByUser(db, user?.id ?? '')
  if (!student) return null
  const overall = overallAvg(db, student.id) ?? 0
  const att = attendanceStats(db, student.id)

  return (
    <Screen scroll>
      <View style={{ backgroundColor: C.black, borderRadius: 22, padding: S.lg, marginBottom: S.lg }}>
        <Row between align="flex-start">
          <View style={{ flex: 1 }}>
            <AiBadge />
            <Text style={{ color: '#fff', fontSize: 21, fontWeight: '800', marginTop: 8 }}>AI Study Coach</Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 6, lineHeight: 19 }}>
              Understand your results, plan your study, prepare for exams — grounded in your actual academic data.
            </Text>
          </View>
          <Icon name="sparkle" size={30} color="rgba(255,255,255,0.7)" />
        </Row>
        <Row gap={10} style={{ marginTop: S.md }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>Overall {Math.round(overall)}%</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>Attendance {att.pct}%</Text>
          </View>
        </Row>
      </View>

      <View style={{ gap: 10 }}>
        {FEATURES.map((f) => (
          <TouchableOpacity key={f.key} activeOpacity={0.8} onPress={() => router.push(f.route as never)}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: f.soft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={f.icon} size={20} color={f.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={F.h3}>{f.title}</Text>
                <Text style={[F.caption, { marginTop: 2, lineHeight: 16 }]}>{f.desc}</Text>
              </View>
              <Icon name="chevron" size={17} color={C.text3} />
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      <Card style={{ marginTop: S.md, backgroundColor: C.warningSoft, borderColor: C.warning + '44' }}>
        <Row gap={8} align="flex-start">
          <Icon name="alert" size={16} color={C.urgent} />
          <Text style={[F.body2, { flex: 1, lineHeight: 18 }]}>
            <Text style={{ fontWeight: '800', color: C.urgent }}>Transparency: </Text>
            All statistics shown here are calculated by the application from school records. AI explains patterns and suggests actions — future outcomes are estimates, never guarantees.
          </Text>
        </Row>
      </Card>
    </Screen>
  )
}