import React from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Avatar } from '@/components/ui'
import { Icon } from '@/components/icons'
import { parentOf, linkedChildren } from '@/data/stats'

export default function ParentMore() {
  const { db, user } = useStore()
  const router = useRouter()
  const parent = parentOf(db, user?.id ?? '')
  if (!parent) return null
  const children = linkedChildren(db, parent.id)

  const items: { icon: Parameters<typeof Icon>[0]['name']; label: string; sub: string; href: string }[] = [
    { icon: 'users', label: 'Manage children', sub: `${children.length} linked`, href: '/parent/children' },
    { icon: 'download', label: 'Report cards & PDFs', sub: 'Generate and share', href: '/parent/child-reports' },
    { icon: 'bell', label: 'Notifications', sub: 'Teacher & school updates', href: '/notifications' },
    { icon: 'timeline', label: 'Activity timeline', sub: 'All events in one view', href: '/timeline' },
    { icon: 'user', label: 'Profile & settings', sub: 'Account and preferences', href: '/profile' },
  ]

  return (
    <Screen scroll>
      <Header title="More" subtitle="Children, reports & settings" />

      <View style={{ gap: 8 }}>
        {items.map((it) => (
          <Card key={it.href} onPress={() => router.push(it.href as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={it.icon} size={18} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={F.h3}>{it.label}</Text>
              <Text style={[F.caption, { marginTop: 1 }]}>{it.sub}</Text>
            </View>
            <Icon name="chevron" size={15} color={C.text3} />
          </Card>
        ))}
      </View>

      <Card style={{ marginTop: S.md, backgroundColor: C.dangerSoft }}>
        <Text style={[F.h3, { color: C.danger }]}>Sign out</Text>
        <Text style={[F.caption, { marginTop: 2 }]}>Return to the demo login screen.</Text>
        <Text style={{ color: C.danger, fontWeight: '800', marginTop: 10 }} onPress={() => { api.logout(); router.replace('/') }}>Log out →</Text>
      </Card>
    </Screen>
  )
}