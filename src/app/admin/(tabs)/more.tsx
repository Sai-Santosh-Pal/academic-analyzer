import React from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore, api, store } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, SectionHeader } from '@/components/ui'
import { Icon } from '@/components/icons'
import { schoolStats } from '@/data/stats'

export default function AdminMore() {
  const { db, user } = useStore()
  const router = useRouter()
  const stats = schoolStats(db)

  const items: { icon: Parameters<typeof Icon>[0]['name']; label: string; sub: string; href: string; onPress?: () => void }[] = [
    { icon: 'download', label: 'School reports', sub: 'AI school intelligence report', href: '/admin/reports' },
    { icon: 'bell', label: 'Notifications', sub: 'School-wide announcements', href: '/notifications' },
    { icon: 'calendar', label: 'School timeline', sub: 'Add events for teachers, parents & students', href: '/admin/timeline' },
    { icon: 'timeline', label: 'Activity timeline', sub: 'All events in one view', href: '/timeline' },
    { icon: 'settings', label: 'Settings', sub: 'School details & data reset', href: '/admin/settings' },
    { icon: 'user', label: 'Profile', sub: 'Account details', href: '/profile' },
    { icon: 'power', label: 'Sign out', sub: 'Return to demo login', href: '', onPress: () => { api.logout(); router.replace('/') } },
  ]

  return (
    <Screen scroll>
      <Header title="More" subtitle="Reports, settings & administration" />

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: S.md }}>
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="school" size={20} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={F.h2}>{store.schoolName}</Text>
          <Text style={[F.caption, { marginTop: 1 }]}>{stats.students} students · {stats.teachers} teachers · {stats.classes} classes</Text>
        </View>
      </Card>

      <View style={{ gap: 8 }}>
        {items.map((it) => (
          <Card key={it.label} onPress={it.onPress ?? (() => router.push(it.href as never))} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: it.label === 'Sign out' ? C.dangerSoft : C.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={it.icon} size={18} color={it.label === 'Sign out' ? C.danger : C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[F.h3, it.label === 'Sign out' && { color: C.danger }]}>{it.label}</Text>
              <Text style={[F.caption, { marginTop: 1 }]}>{it.sub}</Text>
            </View>
            <Icon name="chevron" size={15} color={C.text3} />
          </Card>
        ))}
      </View>

      <SectionHeader title="Insights" />
      <View style={{ gap: 8 }}>
        {db.insights.filter((i) => i.scope === 'school').slice(0, 3).map((i) => (
          <Card key={i.id}>
            <Text style={[F.h3, { fontSize: 13.5 }]}>{i.title}</Text>
            <Text style={[F.caption, { marginTop: 2 }]}>{i.createdAt.slice(0, 10)}</Text>
            <Text style={[F.body2, { marginTop: 4, lineHeight: 18 }]} numberOfLines={3}>{i.body}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  )
}