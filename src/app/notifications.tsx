import React, { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Chip, EmptyState, Row, Btn } from '@/components/ui'
import { Icon, IconName } from '@/components/icons'
import { timeAgo } from '@/utils/date'

const TYPE_META: Record<string, { icon: IconName; color: string; soft: string }> = {
  deadline: { icon: 'clock', color: C.warning, soft: C.warningSoft },
  assessment: { icon: 'calendar', color: C.primary, soft: C.primarySoft },
  marks: { icon: 'check', color: C.success, soft: C.successSoft },
  attendance: { icon: 'user', color: C.accent, soft: C.accentSoft },
  timetable: { icon: 'grid', color: C.primary, soft: C.primarySoft },
  intervention: { icon: 'flag', color: C.ai, soft: C.aiSoft },
  warning: { icon: 'alert', color: C.danger, soft: C.dangerSoft },
  report: { icon: 'file', color: C.primary, soft: C.primarySoft },
  announcement: { icon: 'send', color: C.accent, soft: C.accentSoft },
  system: { icon: 'bell', color: C.text2, soft: C.bg },
}

export default function NotificationsScreen() {
  const { db, user } = useStore()
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  if (!user) return null
  const list = db.notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .filter((n) => (filter === 'unread' ? !n.read : true))
  const unread = db.notifications.filter((n) => n.userId === user.id && !n.read).length

  return (
    <Screen scroll>
      <Header
        title="Notifications"
        subtitle={unread ? `${unread} unread` : 'All caught up'}
        right={<Btn label="Read all" variant="soft" size="sm" onPress={() => api.markAllNotificationsRead(user.id)} />}
      />
      <Row gap={8} style={{ marginBottom: S.md }}>
        <Chip label="All" tone={filter === 'all' ? 'info' : 'neutral'} onPress={() => setFilter('all')} selected={filter === 'all'} />
        <Chip label="Unread" tone={filter === 'unread' ? 'info' : 'neutral'} onPress={() => setFilter('unread')} selected={filter === 'unread'} />
      </Row>

      {!list.length ? (
        <EmptyState icon="bell" title="No notifications" sub="New academic updates will appear here." />
      ) : (
        list.map((n) => {
          const meta = TYPE_META[n.type] ?? TYPE_META.system
          return (
            <Card key={n.id} style={{ marginBottom: 10, opacity: n.read ? 0.72 : 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }} onPress={n.route ? () => router.push(n.route as never) : undefined}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: meta.soft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={meta.icon} size={17} color={meta.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Row between align="flex-start">
                  <Text style={[F.h3, { flex: 1 }]}>{n.title}</Text>
                  {!n.read ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, marginLeft: 6, marginTop: 5 }} /> : null}
                </Row>
                <Text style={[F.body2, { marginTop: 3, lineHeight: 18 }]}>{n.body}</Text>
                <Text style={[F.caption, { marginTop: 5, fontSize: 10.5 }]}>{timeAgo(n.createdAt)} · {n.priority}</Text>
              </View>
              {n.read ? null : (
                <TouchableOpacity onPress={() => api.markNotificationRead(n.id)} hitSlop={8} style={{ padding: 2 }}>
                  <Icon name="check" size={16} color={C.text3} />
                </TouchableOpacity>
              )}
            </Card>
          )
        })
      )}
    </Screen>
  )
}