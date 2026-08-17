import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, Avatar, Notice, EmptyState } from '@/components/ui'
import { Icon, IconName } from '@/components/icons'
import { studentByUser, userOf } from '@/data/stats'

export default function MoreScreen() {
  const { db, user } = useStore()
  const router = useRouter()
  const student = studentByUser(db, user?.id ?? '')
  if (!user) return null
  const unread = db.notifications.filter((n) => n.userId === user.id && !n.read).length

  const LINKS: { label: string; icon: 'attendance' | 'assessments' | 'assignments' | 'timetable' | 'subjects' | 'reports' | 'timeline' | 'notifications' | 'profile' | 'report-card'; title: string; desc: string; route: string }[] = [
    { label: 'attendance', title: 'Attendance', desc: 'Overall, subject-wise and monthly trends', icon: 'attendance', route: '/student/attendance' },
    { label: 'assessments', title: 'Assessments', desc: 'All tests, quizzes and marks', icon: 'assessments', route: '/student/assessments' },
    { label: 'assignments', title: 'Assignments', desc: 'Deadlines, submissions and completion', icon: 'assignments', route: '/student/assignments' },
    { label: 'timetable', title: 'Timetable', desc: 'Weekly class schedule', icon: 'timetable', route: '/student/timetable' },
    { label: 'subjects', title: 'Subjects', desc: 'Subject-wise deep dive', icon: 'subjects', route: '/student/subjects' },
    { label: 'reports', title: 'Reports', desc: 'AI-generated academic reports', icon: 'reports', route: '/student/reports' },
    { label: 'timeline', title: 'Academic timeline', desc: 'Events, shifts and interventions in sequence', icon: 'timeline', route: '/timeline' },
    { label: 'notifications', title: 'Notifications', desc: unread ? `${unread} unread` : 'All caught up', icon: 'notifications', route: '/notifications' },
    { label: 'report-card', title: 'Report card', desc: 'One-click professional PDF', icon: 'report-card', route: `/report-card?studentId=${student?.id}` },
    { label: 'profile', title: 'Profile', desc: 'Account details and sign out', icon: 'profile', route: '/profile' },
  ]

  const ICONS: Record<string, IconName> = {
    attendance: 'user', assessments: 'target', assignments: 'clipboard', timetable: 'grid', subjects: 'book',
    reports: 'file', timeline: 'clock', notifications: 'bell', 'report-card': 'download', profile: 'user',
  }

  return (
    <Screen scroll>
      <Header title="More" />
      <View style={{ gap: 8 }}>
        {LINKS.map((l) => (
          <TouchableOpacity key={l.label} activeOpacity={0.8} onPress={() => router.push(l.route as never)}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={ICONS[l.label]} size={18} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={F.h3}>{l.title}</Text>
                <Text style={[F.caption, { marginTop: 1 }]}>{l.desc}</Text>
              </View>
              {l.label === 'notifications' && unread > 0 ? (
                <View style={{ backgroundColor: C.danger, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{unread}</Text>
                </View>
              ) : null}
              <Icon name="chevron" size={17} color={C.text3} />
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </Screen>
  )
}