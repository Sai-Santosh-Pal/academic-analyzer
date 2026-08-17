import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, AiBadge, Notice } from '@/components/ui'
import { Icon, IconName } from '@/components/icons'
import { teacherOf } from '@/data/stats'

const TOOLS: { key: string; title: string; desc: string; icon: IconName; route: string; color: string; soft: string }[] = [
  { key: 'class', title: 'AI class analysis', desc: 'Strongest & weakest subjects, patterns, actions.', icon: 'users', route: '/teacher/ai-tools?tool=class', color: C.primary, soft: C.primarySoft },
  { key: 'intervention', title: 'Intervention generator', desc: 'Create a structured intervention for a subject/topic.', icon: 'flag', route: '/teacher/interventions?create=1', color: C.success, soft: C.successSoft },
  { key: 'lesson', title: 'AI lesson planner', desc: 'Objectives, structure, activities and a quick assessment.', icon: 'bookOpen', route: '/teacher/lesson-planner', color: C.accent, soft: C.accentSoft },
  { key: 'assessment', title: 'Assessment analysis', desc: 'Distribution and students needing support.', icon: 'target', route: '/teacher/ai-tools?tool=assessment', color: C.warning, soft: C.warningSoft },
  { key: 'investigate', title: 'Investigate a student', desc: 'Select a student from your classes for a full investigation.', icon: 'search', route: '/teacher/students', color: C.ai, soft: C.aiSoft },
]

export default function TeacherAITools() {
  const { db, user } = useStore()
  const router = useRouter()
  const teacher = teacherOf(db, user?.id ?? '')
  if (!teacher) return null

  return (
    <Screen scroll>
      <Header title="AI tools" subtitle="Explanations and recommendations grounded in real data" />
      <Card style={{ backgroundColor: C.aiSoft, borderColor: C.ai + '33' }}>
        <AiBadge />
        <Text style={[F.body2, { marginTop: 6, lineHeight: 19 }]}>
          Every analysis uses statistics computed by the application. AI explains patterns and drafts recommendations — you review before anything is published to students or parents.
        </Text>
      </Card>
      <View style={{ marginTop: S.md, gap: 10 }}>
        {TOOLS.map((t) => (
          <TouchableOpacity key={t.key} activeOpacity={0.8} onPress={() => router.push(t.route as never)}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={t.icon} size={20} color={t.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={F.h3}>{t.title}</Text>
                <Text style={[F.caption, { marginTop: 2, lineHeight: 16 }]}>{t.desc}</Text>
              </View>
              <Icon name="chevron" size={17} color={C.text3} />
            </Card>
          </TouchableOpacity>
        ))}
      </View>
      <Notice tone="warn" >Intervention and lesson content is AI-drafted. Review and edit before publishing.</Notice>
    </Screen>
  )
}